import json
import os
from typing import List, Optional
import openai
from groq import Groq as GroqClient
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# Lazy-initialized clients
_openai_client = None
_groq_client = None
_openai_initialized = False
_groq_initialized = False

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "groq").lower()
GROQ_MODEL = os.getenv("GROQ_MODEL", "mixtral-8x7b-32768")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def _extract_json(output: str) -> Optional[dict]:
    start = output.find("{")
    end = output.rfind("}")
    if start == -1 or end == -1:
        return None
    try:
        return json.loads(output[start:end + 1])
    except json.JSONDecodeError:
        return None


def _get_groq_client():
    """Lazy load Groq client"""
    global _groq_client, _groq_initialized
    if _groq_initialized:
        return _groq_client

    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        _groq_initialized = True
        return None

    try:
        _groq_client = GroqClient(api_key=groq_key)
        _groq_initialized = True
        return _groq_client
    except Exception as e:
        logger.warning(f"Failed to initialize Groq client: {e}")
        _groq_initialized = True
        return None


def _get_openai_client():
    """Lazy load OpenAI client"""
    global _openai_client, _openai_initialized
    if _openai_initialized:
        return _openai_client

    openai_key = os.getenv("OPENAI_API_KEY")
    if not openai_key:
        _openai_initialized = True
        return None

    try:
        _openai_client = openai.OpenAI(api_key=openai_key)
        _openai_initialized = True
        return _openai_client
    except Exception as e:
        logger.warning(f"Failed to initialize OpenAI client: {e}")
        _openai_initialized = True
        return None


def _chat_completion_groq(messages: List[dict], temperature: float = 0.2, max_tokens: int = 900) -> str:
    """Call Groq API"""
    client = _get_groq_client()
    if not client:
        raise ValueError("Groq API key not configured")

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content


def _chat_completion_openai(messages: List[dict], temperature: float = 0.2, max_tokens: int = 900) -> str:
    """Call OpenAI API"""
    client = _get_openai_client()
    if not client:
        raise ValueError("OpenAI API key not configured")

    response = client.chat.completions.create(
        model=OPENAI_MODEL,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content


def _chat_completion(messages: List[dict], temperature: float = 0.2, max_tokens: int = 900) -> str:
    """Route to primary or fallback LLM provider"""
    groq = _get_groq_client()
    openai_client = _get_openai_client()

    if not groq and not openai_client:
        # In demo/dev mode, return a safe canned response so the UI remains usable
        if os.getenv("DEMO_MODE", "0") == "1":
            demo_response = json.dumps({
                "answer": "Demo-mode response: no LLM API key configured. Set OPENAI_API_KEY or GROQ_API_KEY for real results.",
                "strategy": [],
                "risks": [],
                "references": [],
            })
            return demo_response
        raise ValueError("No LLM providers configured. Please set GROQ_API_KEY or OPENAI_API_KEY.")

    try:
        if LLM_PROVIDER == "groq" and groq:
            return _chat_completion_groq(messages, temperature, max_tokens)
        elif openai_client:
            return _chat_completion_openai(messages, temperature, max_tokens)
        elif groq:
            return _chat_completion_groq(messages, temperature, max_tokens)
        else:
            raise ValueError("No working LLM provider available")
    except Exception as e:
        logger.error(f"Error with primary provider: {e}")
        # Fallback to alternative provider
        if LLM_PROVIDER == "groq" and openai_client:
            logger.info("Falling back to OpenAI")
            try:
                return _chat_completion_openai(messages, temperature, max_tokens)
            except Exception as e2:
                logger.error(f"Fallback to OpenAI also failed: {e2}")
                raise
        elif openai_client and groq:
            logger.info("Falling back to Groq")
            try:
                return _chat_completion_groq(messages, temperature, max_tokens)
            except Exception as e2:
                logger.error(f"Fallback to Groq also failed: {e2}")
                raise
        else:
            raise


def chat_assistant(query: str, case_context: Optional[dict] = None, retrieved_cases: Optional[List[dict]] = None) -> dict:
    retrieved_cases = retrieved_cases or []
    case_context_text = ""
    if case_context:
        case_context_text = f"Case title: {case_context.get('title')}\nDescription: {case_context.get('description')}\nSummary: {case_context.get('summary')}\nStrategy: {case_context.get('strategy')}\nRisk level: {case_context.get('risk_level')}\n"

    system_prompt = (
        "You are LexAI, an expert legal operating system assistant. "
        "You must answer in valid JSON with keys: answer, strategy, risks, references. "
        "Provide concise, accurate, professional legal insights."
    )
    references_fragment = json.dumps(retrieved_cases, indent=2) if retrieved_cases else "[]"
    user_prompt = (
        f"A user asked: {query}\n\n"
        f"Case context:\n{case_context_text}\n"
        f"Retrieved cases:\n{references_fragment}\n"
        "Provide a concise, accurate, and professional legal answer. "
        "Include recommended strategy, risk factors, and references from the retrieved cases. "
        "Return only valid JSON with keys: answer, strategy, risks, references."
    )

    try:
        content = _chat_completion([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ])
        parsed = _extract_json(content)
        if parsed is None:
            return {
                "answer": "Unable to parse LLM response. Please check your query.",
                "strategy": [],
                "risks": [],
                "references": []
            }
        def _ensure_list(val):
            if isinstance(val, str):
                return [val]
            elif isinstance(val, list):
                return [str(v) for v in val]
            return []
            
        return {
            "answer": str(parsed.get("answer", "")),
            "strategy": _ensure_list(parsed.get("strategy")),
            "risks": _ensure_list(parsed.get("risks")),
            "references": parsed.get("references", [])
        }
    except Exception as e:
        logger.error(f"LLM service error: {e}")
        return {
            "answer": str(e),
            "strategy": [],
            "risks": [],
            "references": []
        }


def analyze_case(title: str, description: str, similar_cases: List[dict]) -> dict:
    system_prompt = (
        "You are LexAI, a legal intelligence engine. "
        "You must produce valid JSON with keys: summary, strategies, risk_analysis, predicted_outcome. "
        "Base your analysis on the provided case details and similar precedents."
    )
    similar_fragment = json.dumps(similar_cases, indent=2) if similar_cases else "[]"
    user_prompt = (
        f"Analyze the following case:\nTitle: {title}\nDescription: {description}\n\n"
        f"Use similar cases to inform your reasoning:\n{similar_fragment}\n"
        "Provide a summary, strategy recommendations, risk analysis, and a predicted outcome. "
        "Return only valid JSON with keys: summary, strategies, risk_analysis, predicted_outcome."
    )

    try:
        content = _chat_completion([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ])
        parsed = _extract_json(content)
        if parsed is None:
            return {
                "summary": description,
                "strategies": [],
                "risk_analysis": "Unable to analyze at this time",
                "predicted_outcome": "Unknown"
            }
        def _ensure_list(val):
            if isinstance(val, str):
                return [val]
            elif isinstance(val, list):
                return [str(v) for v in val]
            return []
            
        return {
            "summary": str(parsed.get("summary", "")),
            "strategies": _ensure_list(parsed.get("strategies")),
            "risk_analysis": str(parsed.get("risk_analysis", "")),
            "predicted_outcome": str(parsed.get("predicted_outcome", ""))
        }
    except ValueError as e:
        logger.error(f"Case analysis error: {e}")
        return {
            "summary": description,
            "strategies": [],
            "risk_analysis": str(e),
            "predicted_outcome": "Unknown"
        }


def summarize_document(text: str) -> dict:
    system_prompt = (
        "You are LexAI Document AI. Summarize the following legal text, extract key clauses, and identify risk points. "
        "Return only valid JSON with keys: summary, key_clauses, risk_points. "
        "The values for key_clauses and risk_points MUST be a single string (you can use bullet points like '- clause 1\\n- clause 2'), NOT an array."
    )
    # Limit text to first 3000 chars to avoid token limits
    text_sample = text[:3000] if len(text) > 3000 else text
    user_prompt = (
        f"Document text:\n{text_sample}\n\n"
        "Produce a structured response. Be concise but thorough."
    )

    def _ensure_str(val):
        if isinstance(val, list):
            return "\n".join(str(v) for v in val)
        return str(val) if val is not None else ""

    try:
        content = _chat_completion([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ], max_tokens=900)
        parsed = _extract_json(content)
        if parsed is None:
            return {
                "summary": text_sample[:500],
                "key_clauses": "",
                "risk_points": ""
            }
            
        return {
            "summary": _ensure_str(parsed.get("summary")),
            "key_clauses": _ensure_str(parsed.get("key_clauses")),
            "risk_points": _ensure_str(parsed.get("risk_points"))
        }
    except Exception as e:
        logger.error(f"Document summarization error: {e}")
        return {
            "summary": text_sample[:500],
            "key_clauses": "",
            "risk_points": str(e)
        }


def generate_draft(case_details: str, draft_type: str, tone: str = "professional") -> str:
    pass

def generate_draft_new(request_data: dict) -> str:
    draft_type = request_data.get("type", "notice")
    tone = request_data.get("tone", "Formal")
    
    tone_prompts = {
        "formal": "Use precise legal language.",
        "aggressive": "Strong assertive tone, cite penalties.",
        "neutral": "Balanced factual tone.",
        "persuasive": "Compelling narrative favoring client."
    }
    tone_instruction = tone_prompts.get(tone.lower() if tone else "formal", "Use precise legal language.")
    
    system_prompt = (
        f"You are LexAI Draft Generator, an expert Indian legal assistant. "
        f"Generate a {draft_type}. {tone_instruction} "
        "Produce well-structured, professional legal document content in plain text format."
    )
    
    if draft_type.lower() == "notice":
        user_prompt = f"Draft a Legal Notice.\nSender: {request_data.get('sender')}\nRecipient: {request_data.get('recipient')}\nFacts: {request_data.get('facts')}\nDemands: {request_data.get('demands')}\nTone: {tone}\nFormat: Full letter with date, subject, salutation, body paragraphs, and signature block."
    elif draft_type.lower() == "petition":
        user_prompt = f"Draft a Legal Petition.\nCourt: {request_data.get('court')}\nPetitioner: {request_data.get('petitioner')}\nRespondent: {request_data.get('respondent')}\nFacts: {request_data.get('facts')}\nRelief Sought: {request_data.get('relief_sought')}\nTone: {tone}\nFormat: Full court petition with headings, jurisdiction, facts, grounds, and prayer."
    elif draft_type.lower() == "reply":
        user_prompt = f"Draft a Legal Reply.\nReplying Party: {request_data.get('sender') or request_data.get('petitioner')}\nOriginal Sender: {request_data.get('recipient') or request_data.get('respondent')}\nOriginal Notice Summary: {request_data.get('original_notice_summary')}\nResponse Points: {request_data.get('response_points')}\nTone: {tone}\nFormat: Full letter with date, subject, salutation, body paragraphs, and signature block."
    else:
        user_prompt = f"Draft a {draft_type}.\nCase Details: {request_data.get('case_details')}\nTone: {tone}"

    try:
        content = _chat_completion([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ], max_tokens=1500)
        return content
    except Exception as e:
        logger.error(f"Draft generation error: {e}")
        return f"Error generating draft: {e}"
