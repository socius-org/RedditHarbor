# Comment

The `Comment` table stores information about comments made on Reddit submissions. It is only populated if `COLUMNS` contains a `"comment"` entry, and each row only contains the columns you listed there (see [Choosing Columns](columns.md)). The complete set of columns is:

```python
{
    "comment_id": str,  # Unique identifier for the comment (always collected)
    "link_id": str,  # ID of the submission the comment is associated with
    "subreddit": str,  # Name of the subreddit the comment is posted in
    "parent_id": str,  # ID of the parent comment or submission
    "redditor_id": str,  # ID of the user who posted the comment ("deleted" or "suspended" if unavailable)
    "created_at": str,  # Datetime when the comment was created (ISO format)
    "body": str or None,  # Text content of the comment (None if removed)
    "score": {str: int},  # Dictionary mapping datetimes (ISO format) to the comment's score
    "edited": bool,  # Whether the comment has been edited
    "removed": str or None  # "deleted" or "removed" if the comment was removed, otherwise None
}
```

The `parent_id` field can have two different formats:

1. If it starts with `"t3_{link_id}"`, it means the comment is a top-level comment, and the parent is a submission.
2. If it starts with `"t1_{comment_id}"`, it means the comment is a reply to another comment, and the parent is the comment with the specified `comment_id`.

Notes:

- `link_id` also lets RedditHarbor skip submissions whose comments were already collected. Without it, every comment is checked individually against the database instead.
- `body` may contain personal data written by users. Set `mask_pii=True` when collecting to anonymise it.
