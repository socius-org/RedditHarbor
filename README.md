# <picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/2699_fe0f/512.webp" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/2699_fe0f/512.gif" alt="⚙" width="32" height="32"></picture> RedditHarbor
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square&label=license)](https://opensource.org/licenses/MIT)
[![Github Stars](https://img.shields.io/github/stars/socius-org/RedditHarbor?style=flat-square&logo=github)](https://github.com/socius-org/RedditHarbor)
[![Github Watchers](https://img.shields.io/github/watchers/socius-org/RedditHarbor?style=flat-square&logo=github)](https://github.com/socius-org/RedditHarbor)
[![Downloads](https://static.pepy.tech/badge/redditharbor)](https://pypistats.org/packages/redditharbor)
[![PyPI - Downloads](https://img.shields.io/pypi/dm/redditharbor?style=flat-square&logo=python)](https://pypistats.org/packages/redditharbor)

https://github.com/socius-org/RedditHarbor/assets/130935698/71780631-a5b4-4e41-bb37-f882f4fc2926

RedditHarbor simplifies collecting Reddit data and saving it to a database. It removes the complexity of working with APIs, letting you easily build a "harbor" of Reddit data for analysis.

## Introduction 

Social media data from platforms like Reddit contains rich insights into human behaviour and beliefs. However, collecting and storing this data requires dealing with complex APIs.

**RedditHarbor streamlines this entire process so you can focus on your research.**

In plain language:

- It **connects to the Reddit API** and downloads submissions, comments, user profiles etc.
- It allows **anonymising any personally identifiable information (PII)** to protect user privacy and comply with IRBs
- It then **stores this data in an organized database** (Supabase) that you control
- You can then **export the database to CSV/JSON/JPEG formats** for your analysis 

Minimum coding required after the initial setup! The tool is designed specifically for researchers with limited coding backgrounds. 

## Prerequisites

**Reddit API**: You need a Reddit account to access the Reddit API. Follow [Reddit's API guide](https://www.reddit.com/wiki/api/) to register as a developer and create a script app. This will provide the credentials (PUBLIC_KEY and SECRET_KEY) needed to authenticate with Reddit. 

**Supabase API**: Sign up for a [Supabase](https://supabase.com/) account. Create a new project to get the database URL and SECRET_KEY. You will need these credentials to connect and store the Reddit data. 

## Getting Started

### Installation

Install the RedditHarbor package using pip:

```
 #requires Python 3.9 or higher
pip install redditharbor
pip install redditharbor[pii]
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

> **<picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a7/512.webp" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a7/512.gif" alt="🚧" width="20" height="20"></picture>** *RedditHarbor pacakge is dependent on the predefined column names for all users, submissions and comments tables. To ensure proper functionality, it is crucial to create tables with all the specified columns mentioned in the documentation. Failure to do so may lead to errors or incomplete data retrieval.*

### Running the Code: 

To use the package, first create an empty Python file in your IDE of choice, such as [VS Code](https://code.visualstudio.com/). Running the code directly in Jupyter notebook is not recommended, as it may cause errors. To start collecting Reddit data, you first need to configure the authentication:

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

### From Subreddits 
#### Collect Submissions and Users

To collect submissions and associated user data from specified subreddits:

```python
subreddits = ["python", "learnpython"]
sort_types = ["hot", "top"] 
collect.subreddit_submission(subreddits, sort_types, limit=5)
```

This will collect the 5 hottest and 5 top submissions from r/python and r/learnpython, along with the associated user data, and store them in the configured database tables. If you would like to anonymise any pii data, set `mask_pii` as True. 

```python
collect.subreddit_submission(subreddits, sort_types, limit=5, mask_pii=True)
```

> **📝 Supported PII entities:**
> 
> PII is identified and anonymised with Microsoft's [presidio](https://microsoft.github.io/presidio/). Setting `mask_pii` as True will automatically mask [12+ pii entities](https://microsoft.github.io/presidio/supported_entities/) such as `<PERSON>`, `<PHONE NUMBER>` and `<EMAIL_ADDRESS>`.
>
> <picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a7/512.webp" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a7/512.gif" alt="🚧" width="20" height="20"></picture> *While PII is anonymized rigorously to protect privacy, this may inadvertently obscure some entities required for research. For example, "Including food and energy costs, so-called headline PCE actually fell 0.1% on the month and was up just 2.6% from a year ago." will be saved as "Including food and energy costs, so-called headline PCE actually fell 0.1% on <DATE_TIME> and was up just 2.6% from <DATE_TIME>."* 

#### Collect Comments and Users

Similarly, to collect comments and users:

```python   
collect.subreddit_comment(subreddits, sort_types, limit=5, level=2)
```

This will collect comments from the 5 hottest and 5 top submissions from the specified subreddits, up to a depth of 2 reply levels.

#### Collect Submissions, Comments and Users

To collect submissions, associated comments and users in one go:

```python
collect.subreddit_submission_and_comment(subreddits, sort_types, limit=5, level=2)
```

### Keyword Search (Submission)
#### Collect Submissions

To collect submissions based on specific keywords from specified subreddits:

```python
subreddits = ["python", "learnpython"]
query = "data science"
collect.submission_by_keyword(subreddits, query, limit=5)
```

This example collects the 5 most relevant submissions from the subreddits r/python and r/learnpython that contain the keyword "data science." The search can be customized with boolean operators:
- `AND`: Requires all words to be present (e.g. "energy AND oil" returns results with both "energy" and "oil")
- `OR`: Requires at least one word to match (e.g. "energy OR oil" returns results with either "energy" or "oil") 
- `NOT`: Excludes results with a word (e.g. "energy NOT oil" returns results with "energy" but without "oil") 
- `()`: Group parts of the query

> <picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a7/512.webp" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a7/512.gif" alt="🚧" width="20" height="20"></picture> *When using multiple boolean operators, you may sometimes get unexpected results. To control the logic flow, use parentheses to group clauses. For example, "renewable energy NOT fossil fuels OR oil OR gas" returns very different results than "renewable energy NOT (fossil fuels OR oil OR gas)".* 

### From Users 
#### Collect User Submissions

To collect submissions made by specified users, you have to "fetch" user names from existing database:

```python
from redditharbor.utils import fetch

fetch_user = fetch.user(supabase_client=supabase_client, db_name=DB_CONFIG["user"])
users = fetch_user.name(limit=100) #This will fetch the first 100 user names from the user database. Set limit=None to fetch entire user names.  
collect.submission_from_user(users=users, sort_types=["controversial"], limit=10)
```

This will collect 10 most controversial submissions from the specified users. 

#### Collect User Comments

And to collect comments:

```python
collect.comment_from_user(users=users, sort_types=["new"], limit=10) 
```

This will collect 10 most recent comments from the specified users. 

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

This will save all columns from the "submissions" table to a submissions.csv file in the specified folder directory.

You can specify columns and file formats:

```python 
cols = ["submission_id", "title", "score"]
download.to_json(columns = cols, file_name="submission", file_path="<your-folder-name>")
```

This will save columns "submission_id", "title" and "score" from the submission table to a submissions.json file(s) in the specified folder directory.

### Download Images from Submissions

To download image files from the submission data: 

```python
download = download.submission(supabase_client, DB_CONFIG["submission"])
download.to_img(file_path="<your-folder-name>")
```

This will save all .jpg and .png files of the submissions table in the specified folder directory.

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

