# RedditHarbor
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?label=license)](https://opensource.org/licenses/MIT)
[![Github Stars](https://img.shields.io/github/stars/socius-org/RedditHarbor?logo=github)](https://github.com/socius-org/RedditHarbor)
[![Github Watchers](https://img.shields.io/github/watchers/socius-org/RedditHarbor?style=flat&logo=github)](https://github.com/socius-org/RedditHarbor)

https://github.com/socius-org/RedditHarbor/assets/130935698/188aa3b2-1da5-45af-9302-82b6685c573e

RedditHarbor simplifies collecting Reddit data and saving it to a database. It removes the complexity of working with APIs, letting you easily build a "harbor" of Reddit data for analysis.

| Status | Stability | Goal |
| ------ | ------ | ---- |
| ✅ | Alpha | Test and collect feedbacks with a closed set of academic researchers |
| 🚧 | Public Alpha | Open to academic researchers. Publish python package. |
| ❌ | Public Beta | Stability and Flexibility. |
| ❌ | Public | Production-ready. |

## Introduction 

Social media data from platforms like Reddit contains rich insights into human behavior and beliefs. However, collecting and storing this data requires dealing with complex APIs.

**RedditHarbor streamlines this entire process so you can focus on your research.**

In plain language:

- It connects to the Reddit API and downloads posts, comments etc.
- It then stores this data in an organized database (Supabase)
- You can then access the database to analyze the data for your research

No coding required after the initial setup!

## Prerequisites

**Reddit API**: You need a Reddit account to access the Reddit API. Follow [Reddit's API guide](https://www.reddit.com/wiki/api/) to register as a developer and create a script app. This will provide the credentials (PUBLIC_KEY and SECRET_KEY) needed to authenticate with Reddit. 

**Supabase API**: Sign up for a [Supabase](https://supabase.com/) account. Create a new project to get the database URL and SECRET_KEY. You will need these credentials to connect and store the Reddit data. 

## Getting Started

### Installation

Install the RedditHarbor package using pip:

```
pip install redditharbor #requires Python 3.9 or higher
```

### Setting Up Supabase Tables 

We need to create three different types of tables in Supabase to store the user, submission and comments data from Reddit. 

For testing purpose, we will name them "test_redditor", "test_submission", and "test_comment". Go to the [Supabase Dashboard](https://app.supabase.com) and open SQL Editor. Click "New Query" to start a new SQL query, and paste this table creation SQL:

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

This will create the three tables with the required columns and data types. Once created, you will see the new tables now available in the Supabase interface. In the future, you can duplicate these tables and modify the table names for your own production.

> **⚠️ Warning:**
> 
> *RedditHarbor pacakge is dependent on the predefined column names for all users, submissions and comments tables. To ensure proper functionality, it is crucial to create tables with all the specified columns mentioned in the documentation. Failure to do so may lead to errors or incomplete data retrieval.*

### Running the Code: 

Create an empty python file in your IDE. To start collecting Reddit data, you first need to configure the authentication:

```python
SUPABASE_URL = "<your-supabase-url>" 
SUPABASE_KEY = "<your-supabase-api-key>" #Remember to use "service_role/secret" key, not "anon/public" key 

REDDIT_PUBLIC = "<your-reddit-public-key>"
REDDIT_SECRET = "<your-reddit-secret-key>"
REDDIT_USER_AGENT = "<your-reddit-user-agent>" #format - <institution:project-name (u/reddit-username)>
```

Then define the database table names to store the data:

```python
DB_CONFIG = {
  "user": "test_redditor",
  "submission": "test_submission", 
  "comment": "test_comment"
}
```

You can login and create instances of reddit and supabase clients:

```python 
import redditharbor.login as login 

reddit_client = login.reddit(public_key=REDDIT_PUBLIC, secret_key=REDDIT_SECRET, user_agent=REDDIT_USER_AGENT)
supabase_client = login.supabase(url=SUPABASE_URL, private_key=SUPABASE_KEY)
```

## Data Collection 

After initialising an instance of the `collect` class, you can call its various functions to collect Reddit data.

```python 
from redditharbor.dock.pipeline import collect

collect = collect(reddit_client=reddit_client, supabase_client=supabase_client, db_config=DB_CONFIG)
```

### Collect Submissions and Users

To collect submissions and associated user data from specified subreddits:

```python
subreddits = ["python", "learnpython"]
sort_types = ["hot", "top"] 
collect.subreddit_submission(subreddits, sort_types, limit=5)
```

This will collect the 5 hottest and 5 top submissions from r/python and r/learnpython, along with the associated user data, and store them in the configured database tables.

### Collect Comments and Users

Similarly, to collect comments and users:

```python   
collect.subreddit_comment(subreddits, sort_types, limit=5, level=2)
```

This will collect comments from the 5 hottest and 5 top submissions from the specified subreddits, up to a depth of 2 reply levels.

### Collect Submissions, Comments and Users

To collect submissions, associated comments and users in one go:

```python
collect.subreddit_submission_and_comment(subreddits, sort_types, limit=5, level=2)
```

### Collect User Submissions

To collect submissions made by specified users, you have to "fetch" user names from existing database:

```python
from redditharbor.utils import fetch 
fetch_user = fetch.user(supabase_client=supabase_client, db_name=DB_CONFIG["user"])
users = fetch_user.name(limit=100) #This will fetch the first 100 user names from the user database 
sort_types = ["controversial"]
collect.submission_from_user(users, sort_types, limit=10)
```

This will collect 10 most controversial submissions from the specified users. 

### Collect User Comments

And to collect comments:

```python
collect.comment_from_user(users, sort_types, limit=10) 
```

This will collect 10 most controversial comments from the specified users. 

## Downloading Data

The `download` module contains classes for interacting with Supabase tables and downloading their data. The `submission`, `comment` and `user` classes provide identical functionality to download Supabase table data into pickle, CSV, text, and JSON formats. It is recommended to create a new folder under your directory and save data in such a folder:

```python
from redditharbor.utils import download
```

### Download Submissions

To download submission data:

```python
download = download.submission(supabase_client, DB_CONFIG["submission"])
download.to_csv(columns="all", file_name="submission", file_path="<your-folder-name>")
```

This will save all columns from the "submissions" table to a submissions.csv file in the "/<your-folder-name>" directory.

You can specify columns and file formats:

```python 
cols = ["submission_id", "title", "score"]
download.to_json(columns = cols, file_name="submission", file_path="<your-folder-name>")
```

This will save columns "submission_id", "title" and "score" from the submission table to a submissions.json file(s) in the "/<your-folder-name>" directory.

### Download Comments

Similarly, for comments:

```python
download = download.comment(supabase_client, DB_CONFIG["comment"])
download.to_csv(columns="all", file_name="comment", file_path="<your-folder-name>")
```

### Download Users

And users:

```python
download = download.user(supabase_client, DB_CONFIG["user"])
download.to_csv(columns="all", file_name="user", file_path="<your-folder-name>")
```

