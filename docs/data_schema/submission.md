# Submission

The `Submission` table stores information about Reddit submissions. It is only populated if `COLUMNS` contains a `"submission"` entry, and each row only contains the columns you listed there (see [Choosing Columns](columns.md)). The complete set of columns is:

```python
{
    "submission_id": str,  # Unique identifier for the submission (always collected)
    "redditor_id": str,  # ID of the user who posted the submission ("deleted" or "suspended" if unavailable)
    "created_at": str,  # Datetime when the submission was created (ISO format)
    "title": str,  # Title of the submission
    "text": str,  # Text content of the submission
    "subreddit": str,  # Name of the subreddit the submission is posted in
    "permalink": str,  # URL of the submission
    "attachment": {str: str} or None,  # Dictionary containing URLs of attached media (e.g., {"jpg": "https://example.com/image.jpg"})
    "flair": {
        "link": str,  # Link flair text
        "author": str  # Author flair text
    },
    "awards": {
        "list": dict,  # Dictionary mapping award names to [count, coin_price]
        "total_awards_count": int,  # Total number of awards received
        "total_awards_price": int  # Total coin price of all awards received
    },
    "score": {str: int},  # Dictionary mapping datetimes (ISO format) to the submission's score
    "upvote_ratio": {str: float},  # Dictionary mapping datetimes (ISO format) to the upvote ratio
    "num_comments": {str: int},  # Dictionary mapping datetimes (ISO format) to the number of comments
    "edited": bool,  # Whether the submission has been edited
    "archived": bool,  # Whether the submission is archived
    "removed": bool,  # Whether the submission has been removed
    "poll": {
        "total_vote_count": int,  # Total number of votes in the poll
        "vote_ends_at": str,  # Datetime when the poll ends (ISO format)
        "options": {str: int},  # Dictionary mapping poll options to the number of votes
        "closed": bool  # Whether the poll is closed
    } or None  # None if the submission does not have a poll
}
```

Notes:

- `redditor_id` links a submission to its author. If you collect it without a `"user"` table, only the identifier is stored and no user profile is fetched.
- `text` (and to a lesser extent `title` and `flair`) may contain personal data written by users. Set `mask_pii=True` when collecting to anonymise it.
- `score`, `upvote_ratio` and `num_comments` are temporal metrics: the [update module](../hands_on/update_data.md) appends a new timestamped value to whichever of them you collect. `archived` lets the update module skip archived submissions.
- `attachment` is required to download images with `download.submission.to_img()`.
