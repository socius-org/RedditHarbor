# <picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/2699_fe0f/512.webp" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/2699_fe0f/512.gif" alt="⚙" width="32" height="32"></picture> RedditHarbor
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square&label=license)](https://opensource.org/licenses/MIT)
[![Github Stars](https://img.shields.io/github/stars/socius-org/RedditHarbor?style=flat-square&logo=github)](https://github.com/socius-org/RedditHarbor)
[![Github Watchers](https://img.shields.io/github/watchers/socius-org/RedditHarbor?style=flat-square&logo=github)](https://github.com/socius-org/RedditHarbor)
[![Downloads](https://static.pepy.tech/badge/redditharbor)](https://pypistats.org/packages/redditharbor)
[![PyPI - Downloads](https://img.shields.io/pypi/dm/redditharbor?style=flat-square&logo=python)](https://pypistats.org/packages/redditharbor)

![redditharbor_demo](https://github.com/socius-org/RedditHarbor/assets/130935698/7bb4f570-90f7-4e6c-a469-7e8debf9a260)

> ⚠️ **Deprecation notice: RedditHarbor 0.3 and earlier are deprecated and no longer supported.** They collect every column by default, which is incompatible with GDPR data minimisation, and they depend on Supabase's legacy `service_role` keys, which Supabase is retiring by the end of 2026. Upgrade with `pip install --upgrade redditharbor` (Python 3.10+) and follow the [migration guide](https://socius-org.github.io/RedditHarbor/getting_started/migration.html). See the [changelog](CHANGELOG.md) for details.

RedditHarbor simplifies collecting Reddit data and saving it to a database. It removes the complexity of working with APIs, letting you easily build a "harbor" of Reddit data for analysis.

## Introduction 

Social media data from platforms like Reddit contains rich insights into human behaviour and beliefs. However, collecting and storing this data requires dealing with complex APIs.

**RedditHarbor streamlines this entire process so you can focus on your research.**

In plain language:

- **✨ Comprehensive API Data Collection**: Gather Reddit submissions, comments, and user profiles directly from the official data API.

- **🧹 Data Minimisation (GDPR)**: You choose exactly which columns to collect. Nothing else is requested from Reddit or stored in your database.

- **🔒 Privacy-Preserving**: Anonymise PII to protect user privacy and meet ethical/IRB standards. 

- **📦 Controlled Data Storage**: Store collected data in your own secure database for accessibility and organisation.

- **📈 Highly Scalable**: Handle massive datasets with millions of rows through efficient pagination.

- **🕹️ Configurable Collection**: Tailor data gathering to your specific needs via adjustable parameters.

- **📂 Analysis-Ready Exports**: Export to CSV, JSON, JPEG for seamless integration with analysis tools.

- **🔄 Temporal Metric Tracking**: Regularly update post metrics like scores, upvote ratios, awards over time - unlike static snapshot databases.

- **⚡ Smart Update Intervals**: Automatically adjust update frequency based on dataset size for optimised API efficiency.

Minimum coding required after the initial setup! The tool is designed specifically for researchers with limited coding backgrounds. 

## Prerequisites

For a more detailed step-by-step instructions, see our [documentation](https://socius-org.github.io/RedditHarbor/getting_started/prerequisites.html).  

**Reddit API**: You need a Reddit account to access the Reddit API. Follow [Reddit's API guide](https://www.reddit.com/wiki/api/) to register as a developer and create a script app. This will provide the credentials (PUBLIC_KEY and SECRET_KEY) needed to authenticate with Reddit. 

**Supabase API**: Sign up for a [Supabase](https://supabase.com/) account and create a new project. You will need its project URL and a **secret key** (`sb_secret_...`, found under Settings > API Keys) to connect and store the Reddit data. Legacy `service_role` keys still work but are being retired by Supabase. 

## Getting Started

### Installation

Install the RedditHarbor package using pip:

```python
# requires Python 3.10 or higher
pip install redditharbor
pip install redditharbor[pii]
```

`pip install redditharbor[pii]` is required to enable anonymising any personally identifiable information (PII). 

### Choosing What to Collect

Under the GDPR principle of data minimisation, RedditHarbor only collects the columns you explicitly ask for. Before creating any tables, decide which columns your research actually needs from each of the three tables (user, submission and comment) and write them down as a `COLUMNS` dictionary:

```python
COLUMNS = {
    "user": ["redditor_id", "created_at", "karma"],
    "submission": ["submission_id", "redditor_id", "created_at", "title", "text", "subreddit", "score"],
    "comment": ["comment_id", "link_id", "parent_id", "redditor_id", "created_at", "body"],
}
```

Leave a table out (or set it to `None`) if you do not need it at all - for example, drop `"user"` if you do not need user profiles. The primary key of each table (`redditor_id`, `submission_id`, `comment_id`) is always included because rows cannot be stored without it. The full list of available columns, with guidance on which ones contain personal data, is in the [documentation](https://socius-org.github.io/RedditHarbor/data_schema/columns.html).

### Setting Up Supabase Tables 

Next, create one Supabase table for each entity in `COLUMNS`, containing exactly the columns you chose. For testing purposes, we will name them "test_redditor", "test_submission", and "test_comment":

```python
DB_CONFIG = {
  "user": "test_redditor",
  "submission": "test_submission", 
  "comment": "test_comment"
}
```

RedditHarbor generates the table creation SQL for your selection:

```python
from redditharbor import schema

print(schema.create_table_sql(DB_CONFIG, COLUMNS))
```

Go to the [Supabase Dashboard](https://app.supabase.com), open SQL Editor, click "New Query" and paste the printed SQL. For the example `COLUMNS` above it prints:

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

Once created, you will see the new tables in the Supabase interface. In the future, you can duplicate these tables and modify the table names for your own production.

> **<picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a7/512.webp" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f6a7/512.gif" alt="🚧" width="20" height="20"></picture>** *RedditHarbor inserts exactly the columns listed in `COLUMNS`, using the predefined column names and types. Each table must therefore contain every column you configured for it. A missing column will cause an error when inserting; a column in the table that is not in `COLUMNS` is simply never filled in.*

### Running the Code: 

To use the package, first create an empty Python file in your IDE of choice, such as [VS Code](https://code.visualstudio.com/). Running the code directly in Jupyter notebook is not recommended, as it may cause errors. To start collecting Reddit data, you first need to configure the authentication:

```python
SUPABASE_URL = "<your-supabase-url>" 
SUPABASE_KEY = "<your-supabase-secret-key>" # The secret key (sb_secret_...), not the publishable key 

REDDIT_PUBLIC = "<your-reddit-public-key>"
REDDIT_SECRET = "<your-reddit-secret-key>"
REDDIT_USER_AGENT = "<your-reddit-user-agent>" #format - <institution:project-name (u/reddit-username)>
```

Then define the database table names and the columns to collect (the same `DB_CONFIG` and `COLUMNS` you used to create the tables):

```python
DB_CONFIG = {
  "user": "test_redditor",
  "submission": "test_submission", 
  "comment": "test_comment"
}

COLUMNS = {
    "user": ["redditor_id", "created_at", "karma"],
    "submission": ["submission_id", "redditor_id", "created_at", "title", "text", "subreddit", "score"],
    "comment": ["comment_id", "link_id", "parent_id", "redditor_id", "created_at", "body"],
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

collect = collect(reddit_client=reddit_client, supabase_client=supabase_client, db_config=DB_CONFIG, columns=COLUMNS)
```

For example, to collect submissions and associated user data from specified subreddits:

```python
subreddits = ["python", "learnpython"]
sort_types = ["hot", "top"] 
collect.subreddit_submission(subreddits, sort_types, limit=5)
```

This will collect the 5 hottest and 5 top submissions from r/python and r/learnpython, storing only the configured submission columns. The authors' user data is stored as well, because `COLUMNS` includes a `"user"` entry; omit it and no user profiles are collected. If you would like to anonymise any pii data in the text, set `mask_pii` as True. 

```python
collect.subreddit_submission(subreddits, sort_types, limit=5, mask_pii=True)
```

For further use cases - ranging from [collecting subreddit-based data](https://socius-org.github.io/RedditHarbor/hands_on/subreddit_based.html), [collecting keyword-based data](https://socius-org.github.io/RedditHarbor/hands_on/keyword_based.html) and [database-driven data collection](https://socius-org.github.io/RedditHarbor/hands_on/database_driven.html), to [downloading data](https://socius-org.github.io/RedditHarbor/hands_on/download_data.html) and [updating data](https://socius-org.github.io/RedditHarbor/hands_on/update_data.html) - please refer to our [documentation](https://socius-org.github.io/RedditHarbor). 
