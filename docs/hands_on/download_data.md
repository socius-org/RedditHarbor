# Downloading Data 

## Seamlessly download 💾 the data you need, in CSV, JSON, text, or even image formats. 

## Downloading Submissions

To download submission data, simply follow these steps:

```python
from redditharbor.utils import download

download = download.submission(supabase_client, DB_CONFIG["submission"])
download.to_csv(columns="all", file_name="submission", file_path="<your-folder-name>")
```

This will save all columns from the "submissions" table to a `submission.csv` file in the specified folder directory. You can also customize the output by specifying columns and file formats:

```python
cols = ["submission_id", "title", "score"]
download.to_json(columns=cols, file_name="submission", file_path="<your-folder-name>")
```

This will save the "submission_id", "title", and "score" columns from the submission table to a `submission.json` file(s) in the specified folder directory.

## Downloading Images from Submissions

To download image files from the submission data, use:

```python
download = download.submission(supabase_client, DB_CONFIG["submission"])
download.to_img(file_path="<your-folder-name>")
```

This will save all `.jpg` and `.png` files associated with the submissions table in the specified folder directory.

## Downloading Comments

Extracting comment data is just as straightforward:

```python
download = download.comment(supabase_client, DB_CONFIG["comment"])
download.to_csv(columns="all", file_name="comment", file_path="<your-folder-name>")
```

## Downloading User Data

And for user data:

```python
download = download.user(supabase_client, DB_CONFIG["user"])
download.to_csv(columns="all", file_name="user", file_path="<your-folder-name>")
```