# Collecting Keyword-based Data 

## Collect submissions based on specific keywords 🔍 from your desired subreddits.

## Collect Submissions

To collect submissions containing particular keywords from *all* possible subreddits, use the following code:

```python
subreddits = ["all"]
query = "data science"
collect.submission_by_keyword(subreddits, query, limit=5)
```

You can also collect submissions containing particular keywords from specified subreddits:

```python
subreddits = ["python", "learnpython"]
query = "data science"
collect.submission_by_keyword(subreddits, query, limit=5)
```

This example collects the 5 *most relevant* submissions from the subreddits r/python and r/learnpython that contain the keyword "data science."

You can customise your search using boolean operators:

- `AND`: Requires all words to be present (e.g., "energy AND oil" returns results with both "energy" and "oil")
- `OR`: Requires at least one word to match (e.g., "energy OR oil" returns results with either "energy" or "oil")
- `NOT`: Excludes results with a word (e.g., "energy NOT oil" returns results with "energy" but without "oil")
- `()`: Groups parts of the query

When using multiple boolean operators, you may sometimes get unexpected results. To control the logic flow, use parentheses to group clauses. For example, "renewable energy NOT fossil fuels OR oil OR gas" returns very different results than "renewable energy NOT (fossil fuels OR oil OR gas)".

## Collect Comments

Unfortunately, Reddit's Data API does not currently support searching comments based on keywords. However, RedditHarbor provides other powerful features for collecting relevant comment data, which we'll explore in the next section.