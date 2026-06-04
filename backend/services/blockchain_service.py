import hashlib


def sha256_hash_file(file_path: str) -> str:
    hash_obj = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_obj.update(chunk)
    return hash_obj.hexdigest()


def verify_hash(stored_hash: str, computed_hash: str) -> bool:
    return stored_hash == computed_hash
