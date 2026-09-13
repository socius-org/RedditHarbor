# Updating Data

## Unlock temporal insights 📈 with intelligent updates 🔄

The `update()` module streamlines and automates the process of updating crucial metrics for existing submissions (comment and user is currently working-in-progress!). It provides flexibility and configurability to adjust update intervals and data sources. A key advantage of this update module is the ability to track how various metrics, such as the upvote ratio or score, change over time for specific posts. This capability sets RedditHarbor apart from many other Reddit database resources, such as PushShift or Academic Torrents, which typically provide a static "snapshot" of submissions and comments at a random point in time.

## Updating Submissions
To update submission data, follow these steps:

```python
import redditharbor.login as login
from redditharbor.dock.pipeline import update

reddit_client = login.reddit()
supabase_client = login.supabase()
db_config = {
    "user": "test_redditor",
    "submission": "test_submission",
    "comment": "test_comment"
}
columns = {
    "user": ["redditor_id", "created_at", "karma"],
    "submission": ["submission_id", "redditor_id", "created_at", "title", "text", "subreddit", "score"],
    "comment": ["comment_id", "link_id", "parent_id", "redditor_id", "created_at", "body"],
}

update = update(reddit_client, supabase_client, db_config, columns)
update.schedule_task(task="submission", duration="1hr")
```

Pass the same `columns` you used for collection. The update module refreshes whichever of the temporal metrics `score`, `upvote_ratio` and `num_comments` you collect - in the example above only `score` - by appending a new timestamped value to each row every 10 minutes in the next 1 hour of duration. At least one of these three columns must be configured. If you also collect `archived`, archived submissions are skipped and the flag is kept current; otherwise every submission is refreshed on each cycle.

The `update()` module automatically calculates the time interval based on the number of rows to update, adhering to the QPM (queries per minute) limit imposed by the Reddit Data API, which allows only 100 queries per minute per OAuth client ID.

- 0-1,000 rows: update every 10 minutes
- 1,001-3,000 rows: update every 30 minutes
- 3,001-6,000 rows: update every 1 hour
- 6,001-36,000 rows: update every 6 hours
- 36,001-72,000 rows: update every 12 hours
- 72,001+ rows: update every 1 day

<!-- ## Updating Comments
To update comment data, use the following code:

```python
update.schedule_task(task="comment", duration="1hr")
```

This will update the `score` and `upvote ratio` for comments every 10 minutes in the next 1 hour of duration in our database, with the update interval automatically adjusted based on the number of non-archived rows.

## Customizing Updates
You can customize the update process by specifying the desired metrics, intervals, and data sources. For example:

```python
update.schedule_task(task="submission", metrics=["score", "upvote_ratio"], interval="30min", duration="6hr")
```

This will update the `score` and `upvote_ratio` metrics for submissions every 30 minutes for the next 6 hours of duration.
``` -->
