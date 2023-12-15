# RedditHarbor
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?label=license)](https://opensource.org/licenses/MIT)
[![Github Stars](https://img.shields.io/github/stars/socius-org/RedditHarbor?logo=github)](https://github.com/socius-org/RedditHarbor)
[![Github Watchers](https://img.shields.io/github/watchers/socius-org/RedditHarbor?style=flat&logo=github)](https://github.com/socius-org/RedditHarbor)

https://github.com/socius-org/RedditHarbor/assets/130935698/188aa3b2-1da5-45af-9302-82b6685c573e

RedditHarbor is a tool to easily collect Reddit data and store it in a Supabase database. It streamlines the data collection process so you can build a "harbor" of data collected from various subreddits.

| Status | Stability | Goal |
| ------ | ------ | ---- |
| ✅ | Alpha | Test and collect feedbacks with a closed set of academic researchers |
| 🚧 | Public Alpha | Open to academic researchers. Publish python package. |
| ❌ | Public Beta | Stability and Flexibility. |
| ❌ | Public | Production-ready. |

## Prerequisites

**Reddit API**: You need a Reddit account to access the Reddit API. Follow [Reddit's API guide](https://www.reddit.com/wiki/api/) to register as a developer and create a script app. This will provide the credentials (PUBLIC_KEY and SECRET_KEY) needed to authenticate with Reddit. 

**Supabase API**: Sign up for a [Supabase](https://supabase.com/) account. Create a new project to get the database URL and SECRET_KEY. You will need these credentials to connect and store the Reddit data. 

**Environment**: We recommend using Visual Studio Code [(download here)](https://code.visualstudio.com/download). Install the Python extension to get full support for running and editing Python apps. Alternatively you can use your preferred code editor or IDE. 

**Command Prompt**: If you are Windows user, Git Bash is one of the best command prompts [(download here)](https://gitforwindows.org/). Follow the setup wizard, select all the default options. At the Adjusting your PATH environment step, select "Use Git from the Windows Command Prompt" option. Once installed, you will have access to Git Bash which gives you Linux-style command line utilities and git functionality in Windows. 

## Getting Started

### Installation

The following steps create an isolated Python environment to install dependencies without affecting other projects.

**Windows (Git Bash)** 

Right click in a preferred folder and select "Git Bash Here" to open a git bash terminal in that location. Open Git Bash, and clone the repository. 

```
git clone https://github.com/socius-org/RedditHarbor.git
cd RedditHarbor
```

Create and activate a virtual environment:

```
python -m venv venv 
source venv/Scripts/activate
```

Install requirements:

```
pip install -r requirements.txt
```

**Mac**

Open Terminal and clone the repository:

```
git clone https://github.com/socius-org/RedditHarbor.git
cd RedditHarbor
```

Create and activate a virtual environment:

```
python3 -m venv venv
source venv/bin/activate
```

Install requirements:

``` 
pip install -r requirements.txt
```

### Setting Up Supabase Tables 

We need to create three tables in Supabase to store the Reddit data. 

1. Redditors
2. Submissions 
3. Comments

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

This will create the three tables with the required columns and data types. Once created, you will see the new tables now available in the Supabase interface. In the future, you can duplicate these tables and modify the names for your own production tables.

### Running the Code: 

Open `run.py` in your VSCode (or IDE). To start collecting Reddit data, you first need to configure the authentication:

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
  "redditor": "test_redditor",
  "submission": "test_submission", 
  "comment": "test_comment"
}
```

See the script comments in `run.py` for examples of collecting Reddit data. Now you are ready to start collecting Reddit data. Run ```python run.py``` in Git Bash. 


