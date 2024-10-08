# <picture><source srcset="https://fonts.gstatic.com/s/e/notoemoji/latest/2699_fe0f/512.webp" type="image/webp"><img src="https://fonts.gstatic.com/s/e/notoemoji/latest/2699_fe0f/512.gif" alt="⚙" width="32" height="32"></picture> RedditHarbor
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square&label=license)](https://opensource.org/licenses/MIT)
[![Github Stars](https://img.shields.io/github/stars/socius-org/RedditHarbor?style=flat-square&logo=github)](https://github.com/socius-org/RedditHarbor)
[![Github Watchers](https://img.shields.io/github/watchers/socius-org/RedditHarbor?style=flat-square&logo=github)](https://github.com/socius-org/RedditHarbor)
[![Downloads](https://static.pepy.tech/badge/redditharbor)](https://pypistats.org/packages/redditharbor)
[![PyPI - Downloads](https://img.shields.io/pypi/dm/redditharbor?style=flat-square&logo=python)](https://pypistats.org/packages/redditharbor)

![redditharbor_demo](https://github.com/socius-org/RedditHarbor/assets/130935698/7bb4f570-90f7-4e6c-a469-7e8debf9a260)

RedditHarbor simplifies collecting Reddit data and saving it to a database. It removes the complexity of working with APIs, letting you easily build a "harbor" of Reddit data for analysis.

## Introduction 

Social media data from platforms like Reddit contains rich insights into human behaviour and beliefs. However, collecting and storing this data requires dealing with complex APIs.

**RedditHarbor streamlines this entire process so you can focus on your research.**

In plain language:

- **✨ Comprehensive API Data Collection**: Gather Reddit submissions, comments, and user profiles directly from the official data API.

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

**Supabase API**: Sign up for a [Supabase](https://supabase.com/) account. Create a new project to get the database URL and SECRET_KEY. You will need these credentials to connect and store the Reddit data. 

## Getting Started

### Installation

Install the RedditHarbor package using pip:

```python
# requires Python 3.9 or higher
pip install redditharbor
pip install redditharbor[pii]
```

`pip install redditharbor[pii]` is required to enable anonymising any personally identifiable information (PII). 

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

For example, to collect submissions and associated user data from specified subreddits:

```python
subreddits = ["python", "learnpython"]
sort_types = ["hot", "top"] 
collect.subreddit_submission(subreddits, sort_types, limit=5)
```

This will collect the 5 hottest and 5 top submissions from r/python and r/learnpython, along with the associated user data, and store them in the configured database tables. If you would like to anonymise any pii data, set `mask_pii` as True. 

```python
collect.subreddit_submission(subreddits, sort_types, limit=5, mask_pii=True)
```

For further use cases - ranging from [collecting subreddit-based data](https://socius-org.github.io/RedditHarbor/hands_on/subreddit_based.html), [collecting keyword-based data](https://socius-org.github.io/RedditHarbor/hands_on/keyword_based.html) and [database-driven data collection](https://socius-org.github.io/RedditHarbor/hands_on/database_driven.html), to [downloading data](https://socius-org.github.io/RedditHarbor/hands_on/download_data.html) and [updating data](https://socius-org.github.io/RedditHarbor/hands_on/update_data.html) - please refer to our [documentation](https://socius-org.github.io/RedditHarbor). 

## Why RedditHarbor is "Lawful"
### GDPR 