# About

RedditHarbor is a Python library for collecting Reddit data and storing it in a database that you control. It retrieves submissions, comments and user profiles from the official Reddit Data API, stores them in a Postgres database hosted on Supabase, and collects only the columns that you specify.

```{warning}
RedditHarbor 0.3 and earlier are no longer supported. They collect every column by default, which is incompatible with GDPR data minimisation, and they depend on Supabase's legacy API keys, which Supabase is retiring at the end of 2026. Upgrade with `pip install --upgrade redditharbor` and see [Upgrading from 0.3](getting_started/migration.md).
```

## Overview

RedditHarbor is intended for researchers who want to collect Reddit data without writing their own collection and storage code. Libraries such as [PRAW](https://praw.readthedocs.io/en/stable/) give full access to the Reddit API but leave the collection logic, de-duplication, database schema and exports to you. RedditHarbor provides these as a small set of functions with a fixed, documented schema.

The library follows an extract, transform and load (ETL) process:

**Extract.** Submissions, comments and user profiles are collected from the Reddit Data API. Data can be collected by subreddit, by keyword search, or by expanding what is already in your database, for example the comments of stored submissions or the posting history of stored users.

**Transform.** You specify which columns to collect for each table, and only those columns are requested from Reddit and stored. Free-text fields can optionally be anonymised at collection time using Microsoft's presidio, which masks names, phone numbers, email addresses and other personal data.

**Load.** Rows are written to Postgres tables in your Supabase project. Rows are de-duplicated by Reddit id, and reading and writing is paginated so that large tables can be handled. Tables can be exported to CSV, JSON, text, pickle and image files.

**Update.** Submission metrics (score, upvote ratio and number of comments) are stored with a timestamp each time they are collected, and can be refreshed on a schedule. This makes it possible to study how these metrics change over time, which is not possible with a single snapshot.

## Features

- **Data collection**: submissions, comments and user profiles from the Reddit Data API, by subreddit, keyword or existing database content.
- **Data minimisation**: only the columns you list are collected, in line with GDPR requirements.
- **PII anonymisation**: optional masking of personal information in submission and comment text.
- **Your own database**: data is stored in a Supabase project that you own and control.
- **Pagination**: tables with millions of rows can be collected and exported in batches.
- **Exports**: CSV, JSON, text, pickle and image formats.
- **Metric updates**: scores, upvote ratios and comment counts are tracked over time.
- **Update scheduling**: update intervals are set from the table size to stay within the Reddit API rate limit.

## Where to start

1. [Prerequisites](getting_started/prerequisites.md): obtain Reddit and Supabase credentials.
2. [Installation](getting_started/installation.md): install the package.
3. [Setting Up](getting_started/setting_up.md): choose columns, create tables and connect.
4. [Choosing Columns](data_schema/columns.md): every available column, its type, and whether it contains personal data.
5. [Scraping Examples](hands_on/scraping_examples.md), [Downloading Data](hands_on/download_data.md) and [Updating Data](hands_on/update_data.md).

RedditHarbor is developed at [socius](https://socius.org). The source code is on [GitHub](https://github.com/socius-org/RedditHarbor/) and releases are published on [PyPI](https://pypi.org/project/redditharbor/).
