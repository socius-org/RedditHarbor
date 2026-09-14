# Upgrading from 0.3

```{warning}
**RedditHarbor 0.3 and earlier are deprecated and no longer supported.** They collect every column by default, which is incompatible with GDPR data minimisation, and they were built for Supabase's legacy `service_role` keys, which Supabase is retiring by the end of 2026. Upgrade to 0.4 and follow the steps below.
```

## 1. Upgrade Python and the package

RedditHarbor 0.4 requires **Python 3.10 or later** (its dependencies PRAW 8 and supabase-py 2 dropped older versions). Then upgrade the package:

```bash
pip install --upgrade redditharbor
# optionally, for mask_pii=True
pip install --upgrade "redditharbor[pii]"
```

Check what you have installed:

```python
import redditharbor
print(redditharbor.__version__)  # 0.4.0 or later
```

From 0.4 onwards RedditHarbor also prints a notice when a newer release is available on PyPI, so you will hear about future deprecations early. Set the environment variable `REDDITHARBOR_NO_UPDATE_CHECK=1` to turn this off.

## 2. Switch to a Supabase secret key

Supabase replaced the JWT-style `anon` and `service_role` keys with **publishable** (`sb_publishable_...`) and **secret** (`sb_secret_...`) keys. RedditHarbor writes to your database, so it needs the **secret key**:

1. In the Supabase dashboard open **Settings > API Keys**.
2. On the "Publishable and secret API keys" tab, reveal and copy the *Secret key*.
3. Use it as `SUPABASE_KEY` (it replaces the old `service_role` key). The project URL is unchanged.

Legacy keys still work until Supabase retires them, but RedditHarbor now prints a warning when it sees one. It refuses a publishable key, because that key cannot insert rows. See [Prerequisites](prerequisites.md) for screenshots.

## 3. Decide which columns to collect

This is the main change. `collect` and `update` no longer collect everything; they require a `columns` dictionary and collect only what it lists:

```python
COLUMNS = {
    "user": ["redditor_id", "created_at", "karma"],
    "submission": ["submission_id", "redditor_id", "created_at", "title", "text", "subreddit", "score"],
    "comment": ["comment_id", "link_id", "parent_id", "redditor_id", "created_at", "body"],
}

collect = collect(reddit_client, supabase_client, db_config=DB_CONFIG, columns=COLUMNS)
update = update(reddit_client, supabase_client, DB_CONFIG, COLUMNS)
```

Go through the [Choosing Columns](../data_schema/columns.md) page and keep only the columns your research question needs. Leave a table out entirely if you do not need it (for example, omit `"user"` if you do not need user profiles).

Before:

```python
collect = collect(reddit_client=reddit_client, supabase_client=supabase_client, db_config=DB_CONFIG)
```

After:

```python
collect = collect(reddit_client=reddit_client, supabase_client=supabase_client, db_config=DB_CONFIG, columns=COLUMNS)
```

## 4. Adjust your Supabase tables

Tables created with 0.3 contain every column. They keep working with 0.4 as long as they contain the columns you configured: unconfigured columns are simply left `NULL` for new rows.

For new projects, generate tables that contain exactly your selection:

```python
from redditharbor import schema
print(schema.create_table_sql(DB_CONFIG, COLUMNS))
```

For existing projects, consider dropping the columns you no longer collect, especially those holding personal data (such as `name`) that you no longer have a purpose for:

```sql
ALTER TABLE test_redditor DROP COLUMN name;
```

## 5. Behaviour changes to be aware of

- **Suspended accounts**: unless you collect the user `name` column, suspended authors are recorded as `"suspended"` in `redditor_id` and no user row is stored. With `name` collected, the old `"suspended:<username>"` behaviour applies.
- **Comment de-duplication**: the shortcut that skips submissions whose comments were already collected needs the comment `link_id` column. Without it, comments are checked one by one instead.
- **Updates**: `update` refreshes only the metrics you collect (`score`, `upvote_ratio`, `num_comments`) and needs at least one of them. It only filters archived submissions if `archived` is collected.
- **Exports**: `download.<table>.to_csv(columns="all")` now writes a header matching the columns present in your table.
- **Fetching user names** with `fetch.user.name()` requires the `name` column.

## 6. Verify

Run a small collection (for example `limit=5`) and check that the rows in Supabase contain only the columns in `COLUMNS`. Errors, if any, are saved as HTML files in the `error_log` folder next to your script.
