# User 

The `User` collection stores information about Reddit users. Each document in this collection has the following schema:

```python
{
    "redditor_id": str,  # Unique identifier for the user
    "name": str,  # User's Reddit username
    "created_at": str,  # Datetime when the user account was created (ISO format)
    "karma": {
        "link": int,  # Link karma
        "total": int,  # Total karma
        "awardee": int,  # Karma received from awards
        "awarder": int,  # Karma awarded to others
        "comment": int  # Comment karma
    },
    "is_gold": bool,  # Whether the user has Reddit Gold
    "is_mod": {
        str: [str, int]  # Dictionary mapping subreddit IDs to [subreddit name, number of subscribers]
    } or None,  # None if the user is not a moderator
    "trophy": {
        "list": list,  # List of trophy names
        "count": int  # Number of trophies
    } or None,  # None if the user has no trophies
    "removed": str  # "active" or "suspended"
}
```

Note: For suspended users, the `redditor_id` is represented as `"suspended:{name}"`.