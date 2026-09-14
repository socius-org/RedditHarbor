# User 

The `User` table stores information about Reddit users. It is only populated if `COLUMNS` contains a `"user"` entry, and each row only contains the columns you listed there (see [Choosing Columns](columns.md)). The complete set of columns is:

```python
{
    "redditor_id": str,  # Unique identifier for the user (always collected)
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

Notes:

- `name` is the only column that identifies a person directly. Only collect it if your research question requires usernames; `redditor_id` is sufficient to link submissions and comments by the same author.
- Suspended accounts have no id on Reddit. If `name` is collected, they are stored with `redditor_id` set to `"suspended:{name}"` and only the karma fields populated. If `name` is not collected, no user row is stored for them and they appear as `"suspended"` in the `redditor_id` column of submissions and comments.
- `is_mod` and `trophy` each require an additional API request per user. They are only requested when listed in `COLUMNS`.
