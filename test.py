from dock.pipeline import collect
import redditharbor.login as login 
import os 
from utils import download 

# reddit_client = login.reddit()
supabase_client = login.supabase()

DB_CONFIG = {
        "user": "test_redditor",
        "submission": "test_submission",
        "comment": "test_comment",
    }

# collect = collect(reddit=reddit_client, supabase=supabase_client, db_config=DB_CONFIG)
# collect.subreddit_submission(subreddits=["AskReddit"], sort_types=["new"])
# collect.subreddit_comment(subreddits=["AskReddit"], sort_types=["new"])
# collect.subreddit_submission_and_comment(subreddits=["AskReddit"], sort_types=["new"])

# collect.comment_from_user(user_names=["WorldNewsMods", "AcademicPattern2737", "EveningGalaxy"], sort_types=["hot"])
# collect.submission_from_user(user_names=["WorldNewsMods", "AcademicPattern2737", "EveningGalaxy"], sort_types=["hot"])

# print(os.path.dirname(__file__)) 

# submission_db = supabase_client.table("test_submission")

# print(len(submission_db.select("submission_id").range(1, 1000).execute().dict()["data"]))

# test_columns = ["submission_id", "redditor_id", "created_at", "title", "text"]

download = download.user(supabase_client=supabase_client, db_name="test_redditor")

download.to_json(columns = "all", file_name="all", file_path="")