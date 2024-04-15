# Getting Started

## Setting Up Supabase Tables

Next, we need to create three tables in Supabase to store the user, submission, and comment data from Reddit. For testing purposes, we'll name them "test_redditor", "test_submission", and "test_comment".

1. Head to the [Supabase Dashboard](https://app.supabase.com) and open the "SQL Editor" from the sidebar.
2. Click "New Query" to start a new SQL query.
3. Copy and paste the following table creation SQL, then run it:

```sql
-- Create table test_redditor
CREATE TABLE test_redditor (
    redditor_id varchar primary key,
    name varchar,
    created_at timestamptz,
    karma jsonb,
    is_gold boolean,
    is_mod jsonb,
    trophy jsonb,
    removed varchar
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
    permalink varchar,
    attachment jsonb,
    flair jsonb,
    awards jsonb,
    score jsonb,
    upvote_ratio jsonb,
    num_comments jsonb,
    edited boolean,
    archived boolean,
    removed boolean,
    poll jsonb
); 

-- Enable row-level security on test_submission
ALTER TABLE test_submission ENABLE ROW LEVEL SECURITY;

-- Create table test_comment
CREATE TABLE test_comment(
    comment_id varchar primary key,
    link_id varchar,
    subreddit varchar, 
    parent_id varchar,
    redditor_id varchar,
    created_at timestamptz,
    body text,
    score jsonb,
    edited boolean,
    removed varchar
); 

-- Enable row-level security on test_comment
ALTER TABLE test_comment ENABLE ROW LEVEL SECURITY;
```

This will create the three tables with the necessary columns and data types. Once created, you'll see the new tables available in the "Table Editor". In the future, you can duplicate and rename these tables (instead of "test_...") for your production needs. For a structured overview of the database schema used by RedditHarbor, including detailed explanations of each field and its data type, see [Database Schema](../data_schema/user.md). 

```{warning} 
The RedditHarbor package depends on predefined column names for all user, submission, and comment tables. To ensure proper functionality, it's crucial to create tables with all the specified columns mentioned in the documentation. Failure to do so may lead to errors or incomplete data retrieval.
```

## Setting Up for Data Collection

To start collecting Reddit data, create a new Python file in your folder (e.g., `run.py`). Running the code directly in Jupyter Notebook is not recommended, as it may cause errors.

Copy and paste the following code block, which serves as a template to set up RedditHarbor:

```python
import redditharbor.login as login
from redditharbor.dock.pipeline import collect

# Configure authentication
SUPABASE_URL = "<your-supabase-url>"
SUPABASE_KEY = "<your-supabase-api-key>"  # Use "service_role/secret" key, not "anon/public"
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

# Login and create instances of Reddit and Supabase clients
reddit_client = login.reddit(public_key=REDDIT_PUBLIC, secret_key=REDDIT_SECRET, user_agent=REDDIT_USER_AGENT)
supabase_client = login.supabase(url=SUPABASE_URL, private_key=SUPABASE_KEY)

# Initialise an instance of the `collect` class
collect = collect(reddit_client=reddit_client, supabase_client=supabase_client, db_config=DB_CONFIG)
```

Now you're ready to start collecting Reddit data!