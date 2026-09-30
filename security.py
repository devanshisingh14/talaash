"""
Password hashing helpers.

Kept separate from backend/auth.py (which needs FastAPI) so that
create_admin.py can import just this, without pulling in the whole
web framework for a one-time CLI script.
"""
import bcrypt


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
