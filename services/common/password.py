import re

# Mirrors apps/web/src/lib/schemas.ts passwordSchema and the Cognito user
# pool password policy (infra/infra/constructs/auth.py) -- all three must
# stay in sync.
MIN_LENGTH = 8


def validate_password(password: str) -> str | None:
    """Returns an error message, or None if the password is valid."""
    if len(password) < MIN_LENGTH:
        return f"Password must be at least {MIN_LENGTH} characters"
    if not re.search(r"[A-Z]", password):
        return "Password must contain an uppercase letter"
    if not re.search(r"[0-9]", password):
        return "Password must contain a number"
    return None
