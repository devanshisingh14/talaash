"""
One-off helper: set or update a user's email address.

Useful for accounts created before OTP login existed, or if you
need to correct a typo. Run from the project root:

    python set_user_email.py
"""
from database import init_db, get_user_by_username, update_user_email


def main():
    conn = init_db()

    username = input("Username: ").strip()
    user = get_user_by_username(conn, username)
    if user is None:
        print(f"No user named '{username}' found.")
        return

    email = input(f"New email for '{username}': ").strip()
    if not email:
        print("Email cannot be empty.")
        return

    update_user_email(conn, username, email)
    print(f"Updated '{username}' to use {email} for OTP codes.")


if __name__ == "__main__":
    main()
