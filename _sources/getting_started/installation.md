# Installation 

RedditHarbor requires **Python 3.10 or later**. To begin, install the RedditHarbor package using pip in your terminal:

```python
pip install redditharbor
```

Additionally, run `pip install redditharbor[pii]` to enable anonymising any personally identifiable information (PII) from the collected data.

This will download the latest version and install the necessary dependencies. To upgrade the older version to the latest:

```python
pip install --upgrade redditharbor
```

```{warning}
RedditHarbor 0.3 and earlier are deprecated: they collect every column by default and rely on Supabase's legacy API keys, which Supabase is retiring. If you are upgrading from one of those versions, follow [Upgrading from 0.3](migration.md). RedditHarbor prints a notice whenever a newer release is available on PyPI.
```
