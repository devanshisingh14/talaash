"""
Email OTP for login verification and password reset.

Storage is a simple in-memory dict, not a database table -- OTPs are
short-lived (5 minutes) and this is a single-process backend, so
there's no need for anything heavier. Restarting the server clears
any pending codes, which is fine since they expire quickly anyway.

Each code is tagged with a "purpose" (login or reset) so a code
issued for one flow can't be reused for the other.

Email delivery: if SMTP_HOST (and friends) are set as environment
variables, a real email is sent. If not, the code is printed to the
backend terminal instead, so you can test the whole flow before
setting up a real email provider.
"""
import os
import random
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText

OTP_LENGTH = 6
OTP_VALID_MINUTES = 5

# username -> {"code": str, "expires_at": datetime, "purpose": str}
_otp_store = {}

SMTP_HOST = os.environ.get("SMTP_HOST")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD")
FROM_EMAIL = os.environ.get("FROM_EMAIL", SMTP_USER or "noreply@talaash.local")


def generate_and_store_otp(username: str, purpose: str = "login") -> str:
    code = "".join(str(random.randint(0, 9)) for _ in range(OTP_LENGTH))
    _otp_store[username] = {
        "code": code,
        "expires_at": datetime.now() + timedelta(minutes=OTP_VALID_MINUTES),
        "purpose": purpose,
    }
    return code


def verify_otp(username: str, submitted_code: str, purpose: str = "login") -> bool:
    entry = _otp_store.get(username)
    if entry is None:
        return False

    if datetime.now() > entry["expires_at"]:
        del _otp_store[username]
        return False

    if entry["purpose"] != purpose:
        return False

    if submitted_code != entry["code"]:
        return False

    # One-time use: remove it once successfully verified.
    del _otp_store[username]
    return True


def send_otp_email(to_email: str | None, username: str, code: str, purpose: str = "login"):
    subject = "TALAASH login verification code" if purpose == "login" else "TALAASH password reset code"
    label = "login" if purpose == "login" else "password reset"

    if not to_email:
        print(
            f"[OTP] No email on file for '{username}'. "
            f"{label.capitalize()} code (would normally be emailed): {code}"
        )
        return

    if not SMTP_HOST:
        print(
            f"[OTP] SMTP not configured -- printing instead of emailing.\n"
            f"[OTP] {label.capitalize()} code for {username} <{to_email}>: {code} "
            f"(valid {OTP_VALID_MINUTES} minutes)"
        )
        return

    message = MIMEText(
        f"Your TALAASH {label} verification code is: {code}\n\n"
        f"This code expires in {OTP_VALID_MINUTES} minutes. "
        f"If you did not request this, you can ignore this email."
    )
    message["Subject"] = subject
    message["From"] = FROM_EMAIL
    message["To"] = to_email

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            if SMTP_USER and SMTP_PASSWORD:
                server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, [to_email], message.as_string())
        print(f"[OTP] Emailed {label} code to {to_email}")
    except Exception as e:
        print(f"[OTP] ERROR sending email: {e}")
        print(f"[OTP] Falling back to console. {label.capitalize()} code for {username}: {code}")