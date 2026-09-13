# Setting Up

## Choosing What to Collect

RedditHarbor follows the GDPR principle of data minimisation: it only collects the columns you explicitly ask for, and nothing else is requested from Reddit or stored in your database. So the first step is to decide which columns your research actually needs from each of the three tables (user, submission and comment), and to write them down as a `COLUMNS` dictionary:

```python
COLUMNS = {
    "user": ["redditor_id", "created_at", "karma"],
    "submission": ["submission_id", "redditor_id", "created_at", "title", "text", "subreddit", "score"],
    "comment": ["comment_id", "link_id", "parent_id", "redditor_id", "created_at", "body"],
}
```

A few rules:

- Leave a table out (or set it to `None`) if you do not need it at all. For example, drop `"user"` if you do not need user profiles - the authors of submissions and comments will then never be looked up.
- The primary key of each table (`redditor_id`, `submission_id`, `comment_id`) is always included, because rows cannot be stored or de-duplicated without it.
- Column names are validated when you create the `collect` instance, so a typo raises an error before any data is collected.

The full list of available columns, with guidance on which ones contain personal data and what you lose by leaving a column out, is in [Choosing Columns](../data_schema/columns.md).

## Setting Up Supabase Tables

Next, we need to create one Supabase table for each entity in `COLUMNS`, containing exactly the columns you chose. For testing purposes, we'll name them "test_redditor", "test_submission", and "test_comment":

```python
DB_CONFIG = {
    "user": "test_redditor",
    "submission": "test_submission",
    "comment": "test_comment"
}
```

RedditHarbor generates the table creation SQL for your selection, so you never have to write it by hand:

```python
from redditharbor import schema

print(schema.create_table_sql(DB_CONFIG, COLUMNS))
```

1. Head to the [Supabase Dashboard](https://app.supabase.com) and open the "SQL Editor" from the sidebar.
2. Click "New Query" to start a new SQL query.
3. Paste the printed SQL, then run it.

For the example `COLUMNS` above, the generated SQL is:

```sql
-- Create table test_redditor
CREATE TABLE test_redditor (
    redditor_id varchar primary key,
    created_at timestamptz,
    karma jsonb
);

-- Enable row-level security on test_redditor
ALTER TABLE test_redditor ENABLE ROW LEVEL SECURITY;

-- Create table test_submission
CREATE TABLE test_submission (
    submission_id varchar primary key,
    redditor_id varchar,
    created_at timestamptz,
    title varchar,
    text text,
    subreddit varchar,
    score jsonb
);

-- Enable row-level security on test_submission
ALTER TABLE test_submission ENABLE ROW LEVEL SECURITY;

-- Create table test_comment
CREATE TABLE test_comment (
    comment_id varchar primary key,
    link_id varchar,
    parent_id varchar,
    redditor_id varchar,
    created_at timestamptz,
    body text
);

-- Enable row-level security on test_comment
ALTER TABLE test_comment ENABLE ROW LEVEL SECURITY;
```

Once created, you'll see the new tables available in the "Table Editor". In the future, you can duplicate and rename these tables (instead of "test_...") for your production needs. For a structured overview of every column RedditHarbor can collect, including detailed explanations of each field and its data type, see [Database Schema](../data_schema/columns.md). 

```{warning} 
RedditHarbor inserts exactly the columns listed in `COLUMNS`, using the predefined column names and types. Each table must therefore contain every column you configured for it. A missing column will cause an error when inserting rows; a column that exists in the table but is not in `COLUMNS` is simply never filled in.
```

## Setting Up for Data Collection

To start collecting Reddit data, create a new Python file in your folder (e.g., `run.py`). Running the code directly in Jupyter Notebook is not recommended, as it may cause errors.

Copy and paste the following code block, which serves as a template to set up RedditHarbor:

```python
import redditharbor.login as login
from redditharbor.dock.pipeline import collect

# Configure authentication
SUPABASE_URL = "<your-supabase-url>"
SUPABASE_KEY = "<your-supabase-secret-key>"  # The secret key (sb_secret_...), not the publishable key
REDDIT_PUBLIC = "<your-reddit-public-key>"
REDDIT_SECRET = "<your-reddit-secret-key>"
REDDIT_USER_AGENT = "<your-reddit-user-agent>"  # Format: <institution:project-name (u/reddit-username)>
# e.g. REDDIT_USER_AGENT = "LondonSchoolofEconomics:ICWSM-tutorial (u/reddit-username)" 

# Define database table names
DB_CONFIG = {
    "user": "test_redditor",
    "submission": "test_submission",
    "comment": "test_comment"
}

# Define the columns to collect (the same selection you used to create the tables)
COLUMNS = {
    "user": ["redditor_id", "created_at", "karma"],
    "submission": ["submission_id", "redditor_id", "created_at", "title", "text", "subreddit", "score"],
    "comment": ["comment_id", "link_id", "parent_id", "redditor_id", "created_at", "body"],
}

# Login and create instances of Reddit and Supabase clients
reddit_client = login.reddit(public_key=REDDIT_PUBLIC, secret_key=REDDIT_SECRET, user_agent=REDDIT_USER_AGENT)
supabase_client = login.supabase(url=SUPABASE_URL, private_key=SUPABASE_KEY)

# Initialise an instance of the `collect` class
collect = collect(reddit_client=reddit_client, supabase_client=supabase_client, db_config=DB_CONFIG, columns=COLUMNS)
```

You are ready to collect data.
