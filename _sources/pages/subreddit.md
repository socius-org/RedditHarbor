# Collecting Subreddit-based Data 

## Collect data from specific subreddits 📚, whether you're interested in submissions, comments, or user information. 

## Collect Submissions and Users

To collect submissions and associated user data from specified subreddits, simply run:

```python
subreddits = ["python", "learnpython"]
sort_types = ["hot", "top"]
collect.subreddit_submission(subreddits, sort_types, limit=5)
```

This will fetch the 5 hottest and 5 top submissions from r/python and r/learnpython, along with the corresponding user data, and store them in your configured database tables.

If you'd like to anonymise any personally identifiable information (PII), set `mask_pii` to `True`:

```python
collect.subreddit_submission(subreddits, sort_types, limit=5, mask_pii=True)
```

```{admonition} Supported PII Entities 
:class: warning
PII is identified and anonymised using Microsoft's [presidio](https://microsoft.github.io/presidio/). Setting `mask_pii` to `True` will automatically mask [12+ PII entities](https://microsoft.github.io/presidio/supported_entities/) such as `<PERSON>`, `<PHONE NUMBER>`, and `<EMAIL_ADDRESS>`. However, while PII is rigorously anonymised to protect privacy, this may inadvertently obscure some entities required for research. For example, "Including food and energy costs, so-called headline PCE actually fell 0.1% on the month and was up just 2.6% from a year ago." will be saved as "Including food and energy costs, so-called headline PCE actually fell 0.1% on <DATE_TIME> and was up just 2.6% from <DATE_TIME>."
```

## Collect Comments and Users

To collect comments and associated user data, use:

```python
collect.subreddit_comment(subreddits, sort_types, limit=5, level=2)
```

This will fetch comments from the 5 hottest and 5 top submissions in the specified subreddits, up to a depth of 2 reply levels. If you want to retrieve entire comment threads, set `level` to `None`:

```python
collect.subreddit_comment(subreddits, sort_types, limit=5, level=None)
```

## Collect Submissions, Comments, and Users

To collect submissions, associated comments, and user data in one go, use:

```python
collect.subreddit_submission_and_comment(subreddits, sort_types, limit=5, level=2)
```