"""
One-off helper: delete a user account (admin or officer).

Run from the project root:
    python delete_user.py
"""
from database import init_db, get_user_by_username, delete_user, list_users


def main():
    conn = init_db()

    users = list_users(conn)
    if not users:
        print("No users exist yet.")
        return

    print("Current users:")
    for u in users:
        print(f"  - {u['username']} ({u['role']})")

    username = input("\nUsername to delete: ").strip()
    user = get_user_by_username(conn, username)
    if user is None:
        print(f"No user named '{username}' found.")
        return

    confirm = input(f"Type '{username}' again to confirm deletion: ").strip()
    if confirm != username:
        print("Confirmation did not match. Nothing was deleted.")
        return

    delete_user(conn, username)
    print(f"Deleted user '{username}'.")


if __name__ == "__main__":
    main()
