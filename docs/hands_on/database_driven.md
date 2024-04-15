# Database-Driven Data Collection

## Leverage your existing database 📂 to collect additional relevant data, such as comments from specific submissions or user activity. 

## Collect Submission Comments

While you cannot directly collect comments containing particular keywords, you can collect comments from submissions that match your keywords of interest. To gather comments from specified submissions, use the following code:

```python
from redditharbor.utils import fetch

fetch_submission = fetch.submission(supabase_client=supabase_client, db_name=db_config["submission"])
submission_ids = fetch_submission.id(limit=100)  # Limiting to 100 submission IDs for demonstration. Set limit=None to fetch all submission IDs.

collect.comment_from_submission(submission_ids=submission_ids, level=2)  # Set level=None to collect entire comment threads
```

This will collect comments from the specified 100 submissions up to level 2 (e.g., including replies to top-level comments).

## Collect User Submissions

To collect submissions made by specified users, you'll need to "fetch" user names from your existing database:

```python
from redditharbor.utils import fetch

fetch_user = fetch.user(supabase_client=supabase_client, db_name=DB_CONFIG["user"])
users = fetch_user.name(limit=100)  # This will fetch the first 100 user names from the user database. Set limit=None to fetch all user names.

collect.submission_from_user(users=users, sort_types=["controversial"], limit=10)
```

This will collect the 10 most controversial submissions from the specified users.

## Collect User Comments

To collect comments made by specified users, use:

```python
collect.comment_from_user(users=users, sort_types=["new"], limit=10)
```

This will collect the 10 most recent comments from the specified users.