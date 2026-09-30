"""
One-time setup script: creates the first Admin account for TALAASH.

Run from the project root (with your venv activated):
    python create_admin.py

Officers can be added later through the admin-only
POST /api/auth/users endpoint once a User Management page exists,
or you can run this script again with role="officer" changed below
for a quick manual addition.
"""
import getpass

from database import get_user_by_username, init_db, create_user
from security import hash_password


def main():
    conn = init_db()

    username = input("Admin username: ").strip()
    if not username:
        print("Username cannot be empty.")
        return
    if get_user_by_username(conn, username):
        print(f"A user named '{username}' already exists.")
        return

    full_name = input("Full name: ").strip()
    email = input("Email (for OTP login codes): ").strip()
    password = getpass.getpass("Password: ")
    confirm = getpass.getpass("Confirm password: ")

    if not password:
        print("Password cannot be empty.")
        return
    if password != confirm:
        print("Passwords did not match. Try again.")
        return

    create_user(
        conn, username, hash_password(password),
        role="admin", full_name=full_name or None, email=email or None,
    )
    print(f"Admin account '{username}' created. You can now log in from the frontend.")
    if not email:
        print("Note: no email was set, so OTP codes will just print in the backend terminal.")


if __name__ == "__main__":
    main()