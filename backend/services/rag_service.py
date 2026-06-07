import os
import json
from typing import Dict, List, Optional
import faiss
import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from models import Case
from services.ai_service import _get_openai_client

EMBED_DIM = 1536
INDEX_FILE = "data/faiss_index.bin"
METADATA_FILE = "data/faiss_metadata.json"

index = faiss.IndexFlatIP(EMBED_DIM)
case_index_map: List[int] = []
case_metadata: Dict[int, Dict[str, str]] = {}


def _save_index():
    os.makedirs("data", exist_ok=True)
    faiss.write_index(index, INDEX_FILE)
    with open(METADATA_FILE, "w") as f:
        json.dump({
            "case_index_map": case_index_map,
            "case_metadata": case_metadata
        }, f)


def _load_index():
    global index, case_index_map, case_metadata
    if os.path.exists(INDEX_FILE) and os.path.exists(METADATA_FILE):
        try:
            temp_index = faiss.read_index(INDEX_FILE)
            if temp_index.d != EMBED_DIM:
                print(f"Index dimension mismatch ({temp_index.d} != {EMBED_DIM}). Rebuilding index.")
                return False
            index = temp_index
            with open(METADATA_FILE, "r") as f:
                data = json.load(f)
                case_index_map = data.get("case_index_map", [])
                case_metadata = {int(k): v for k, v in data.get("case_metadata", {}).items()}
            return True
        except Exception as e:
            print(f"Failed to load index: {e}")
    return False


def _normalize_vector(embedding: np.ndarray) -> np.ndarray:
    if embedding.ndim == 1:
        embedding = embedding.reshape(1, -1)
    normalized = embedding.astype(np.float32)
    norms = np.linalg.norm(normalized, axis=1, keepdims=True) + 1e-12
    return normalized / norms


def embed_text(text: str) -> np.ndarray:
    client = _get_openai_client()
    if not client:
        print("Warning: OPENAI_API_KEY not set. Using random embeddings for RAG fallback.")
        return _normalize_vector(np.random.rand(1, EMBED_DIM))
    
    try:
        response = client.embeddings.create(
            input=[text],
            model="text-embedding-3-small"
        )
        return _normalize_vector(np.array(response.data[0].embedding))
    except Exception as e:
        print(f"Embedding error: {e}")
        return _normalize_vector(np.random.rand(1, EMBED_DIM))


async def build_index(session: AsyncSession):
    global index, case_index_map, case_metadata
    if _load_index():
        return
        
    index.reset()
    case_index_map = []
    case_metadata = {}

    result = await session.execute(select(Case))
    cases = result.scalars().all()
    for case in cases:
        vector = embed_text("\n".join([case.title or "", case.description or "", case.summary or ""]))
        index.add(vector)
        case_index_map.append(case.id)
        case_metadata[case.id] = {
            "title": case.title,
            "description": case.description,
            "outcome": case.outcome or "",
            "summary": case.summary or "",
            "risk_level": case.risk_level,
            "strategy": case.strategy or "",
        }
    _save_index()


async def index_case(case_id: int, title: str, description: str, summary: Optional[str] = None):
    global case_index_map, case_metadata
    vector = embed_text("\n".join([title, description, summary or ""]))
    index.add(vector)
    case_index_map.append(case_id)
    case_metadata[case_id] = {
        "title": title,
        "description": description,
        "outcome": "",
        "summary": summary or "",
        "risk_level": "",
        "strategy": "",
    }
    _save_index()


async def search_similar_cases(query: str, k: int = 5) -> List[Dict[str, object]]:
    if index.ntotal == 0:
        return []
    query_vector = embed_text(query)
    distances, indices = index.search(query_vector, min(k, index.ntotal))
    results = []
    for score, idx in zip(distances[0], indices[0]):
        if idx < 0 or idx >= len(case_index_map):
            continue
            
        if float(score) < 0.3:
            continue
            
        case_id = case_index_map[idx]
        metadata = case_metadata.get(case_id, {})
        results.append(
            {
                "case_id": case_id,
                "title": metadata.get("title", ""),
                "description": metadata.get("description", ""),
                "summary": metadata.get("summary", ""),
                "risk_level": metadata.get("risk_level", ""),
                "outcome": metadata.get("outcome", ""),
                "strategy": metadata.get("strategy", ""),
                "score": float(score),
            }
        )
    return results
