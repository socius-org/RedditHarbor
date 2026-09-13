# Choosing Columns

## Collect only what your research needs

RedditHarbor is built around the GDPR principle of **data minimisation** (Art. 5(1)(c)): personal data must be "adequate, relevant and limited to what is necessary" for the purpose it is collected for. Rather than collecting every field Reddit exposes, you tell RedditHarbor exactly which columns you need, and only those are requested from Reddit and stored in your database.

You do this with a `COLUMNS` dictionary that maps each table to the list of columns to collect:

```python
COLUMNS = {
    "user": ["redditor_id", "created_at", "karma"],
    "submission": ["submission_id", "redditor_id", "created_at", "title", "text", "subreddit", "score"],
    "comment": ["comment_id", "link_id", "parent_id", "redditor_id", "created_at", "body"],
}

collect = collect(reddit_client, supabase_client, db_config=DB_CONFIG, columns=COLUMNS)
```

- **Tables you leave out are not collected.** Omit `"user"` (or set it to `None`) and no user profiles are collected; authors of submissions and comments are never looked up unless `redditor_id` is requested on those tables.
- **Primary keys are always included.** `redditor_id`, `submission_id` and `comment_id` identify rows and are needed to avoid storing duplicates, so they are added automatically.
- **Everything else is opt-in.** A column that is not listed is neither fetched from Reddit nor written to the database. In particular, `is_mod` and `trophy` trigger extra API calls that are skipped when they are not requested.
- **Configurations are validated.** Unknown table or column names raise a `ValueError` before any data is collected, and calling a collection method for a table you did not configure raises a clear error.

```{tip}
Think about the *purpose* of each column. Do you need usernames, or is the pseudonymous `redditor_id` enough to link posts by the same author? Do you need the full `text`, or only `title`? The fewer personal-data columns you collect, the simpler your data-protection obligations are.
```

## Available Columns

The tables below list every column RedditHarbor can collect. The "personal data" column flags fields that identify a person directly or indirectly, or that may contain personal data written by users; treat them with corresponding care in your data management plan. Free-text fields (`text`, `body`) can be anonymised at collection time with `mask_pii=True`.

### User

| Column | Type | Personal data | Description |
| --- | --- | --- | --- |
| `redditor_id` | `varchar` (primary key) | Pseudonymous identifier | Reddit's internal id of the account. Always collected. |
| `name` | `varchar` | **Yes** (direct identifier) | The public username. Only needed if you must identify accounts by name. Required to record suspended accounts (see below). |
| `created_at` | `timestamptz` | Indirect | Account creation time. |
| `karma` | `jsonb` | Indirect | Comment, link, awardee, awarder and total karma. |
| `is_gold` | `boolean` | Indirect | Whether the account has Reddit Premium. |
| `is_mod` | `jsonb` | Indirect | Subreddits moderated by the account. Requires an extra API call per user. |
| `trophy` | `jsonb` | Indirect | Trophies of the account. Requires an extra API call per user. |
| `removed` | `varchar` | Indirect | `"active"` or `"suspended"`. |

### Submission

| Column | Type | Personal data | Description |
| --- | --- | --- | --- |
| `submission_id` | `varchar` (primary key) | No | Reddit's id of the submission. Always collected. |
| `redditor_id` | `varchar` | Pseudonymous identifier | Id of the author (`"deleted"` or `"suspended"` when unavailable). |
| `created_at` | `timestamptz` | No | Submission time. |
| `title` | `varchar` | May contain | Title of the submission. |
| `text` | `text` | May contain | Body text of the submission. Anonymise with `mask_pii=True`. |
| `subreddit` | `varchar` | No | Subreddit name. |
| `permalink` | `varchar` | Indirect | URL of the submission on Reddit. |
| `attachment` | `jsonb` | May contain | URL of the attached image, video or link. Needed for `download.submission.to_img()`. |
| `flair` | `jsonb` | May contain | Link flair and author flair text. |
| `awards` | `jsonb` | No | Awards received. |
| `score` | `jsonb` | No | Score over time, keyed by access time. Updatable with `update`. |
| `upvote_ratio` | `jsonb` | No | Upvote ratio over time. Updatable with `update`. |
| `num_comments` | `jsonb` | No | Number of comments over time. Updatable with `update`. |
| `edited` | `boolean` | No | Whether the submission was edited. |
| `archived` | `boolean` | No | Whether the submission is archived. Lets `update` skip archived rows. |
| `removed` | `boolean` | No | Whether the submission was removed. |
| `poll` | `jsonb` | No | Poll options and results, if the submission is a poll. |

### Comment

| Column | Type | Personal data | Description |
| --- | --- | --- | --- |
| `comment_id` | `varchar` (primary key) | No | Reddit's id of the comment. Always collected. |
| `link_id` | `varchar` | No | Id of the submission the comment belongs to. Also lets RedditHarbor skip submissions whose comments were already collected. |
| `subreddit` | `varchar` | No | Subreddit name. |
| `parent_id` | `varchar` | No | Id of the parent submission (`t3_...`) or comment (`t1_...`). |
| `redditor_id` | `varchar` | Pseudonymous identifier | Id of the author (`"deleted"` or `"suspended"` when unavailable). |
| `created_at` | `timestamptz` | No | Comment time. |
| `body` | `text` | May contain | Text of the comment (`None` if deleted or removed). Anonymise with `mask_pii=True`. |
| `score` | `jsonb` | No | Score over time, keyed by access time. |
| `edited` | `boolean` | No | Whether the comment was edited. |
| `removed` | `varchar` | No | `"deleted"`, `"removed"` or `None`. |

You can also inspect the available columns and their types from Python:

```python
from redditharbor import schema

print(schema.USER_COLUMNS)
print(schema.SUBMISSION_COLUMNS)
print(schema.COMMENT_COLUMNS)
```

## What Changes When a Column Is Left Out

Most columns are independent, but a few affect how RedditHarbor behaves:

- **`user.name`**: Reddit exposes no id for suspended accounts, only their username. Without `name`, a suspended author is recorded as `"suspended"` in `redditor_id` and no user row is stored for them. With `name`, they are stored as `"suspended:<username>"`, as in earlier versions. `fetch.user.name()` also requires this column.
- **`comment.link_id`**: used to skip submissions whose comments were already collected. Without it, RedditHarbor falls back to checking every comment individually against the database, which is slower but gives the same result.
- **`submission.score`, `upvote_ratio`, `num_comments`**: the `update` module refreshes whichever of these you collect, and requires at least one of them.
- **`submission.archived`**: lets `update` skip archived submissions and keep the flag current. Without it, every submission is refreshed on each cycle.
- **`submission.created_at`**: used to order submissions during updates. Without it, they are ordered by `submission_id`.
- **`submission.attachment`**: required by `download.submission.to_img()`.

## Generating the Table SQL

Your Supabase tables must contain exactly the columns you configured. RedditHarbor generates the SQL for you:

```python
from redditharbor import schema

DB_CONFIG = {
    "user": "test_redditor",
    "submission": "test_submission",
    "comment": "test_comment"
}

print(schema.create_table_sql(DB_CONFIG, COLUMNS))
```

Paste the output into the Supabase SQL Editor; see [Setting Up](../getting_started/setting_up.md) for the step-by-step guide.

## Changing Your Selection Later

If you later need an additional column, add it to the table in Supabase (with the type listed above) and to `COLUMNS`. Rows collected earlier will have `NULL` in the new column, because RedditHarbor never re-fetches data for existing rows. If you stop needing a column, remove it from `COLUMNS`; you can then drop it from the table, and should do so if it holds personal data you no longer have a purpose for.
