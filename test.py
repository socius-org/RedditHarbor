import redditharbor.login as login 
from redditharbor.dock.pipeline import collect
from redditharbor.utils import download
import os 

# reddit_client = login.reddit()
supabase_client = login.supabase()

# DB_CONFIG = {
#         "user": "test_redditor",
#         "submission": "test_submission",
#         "comment": "test_comment",
#     }

# collect = collect(reddit_client=reddit_client, supabase_client=supabase_client, db_config=DB_CONFIG)
# collect.subreddit_submission(subreddits=["AskReddit"], sort_types=["new"])
# collect.subreddit_comment(subreddits=["AskReddit"], sort_types=["new"])
# collect.subreddit_submission_and_comment(subreddits=["AskReddit"], sort_types=["new"])

# collect.comment_from_user(user_names=["WorldNewsMods", "AcademicPattern2737", "EveningGalaxy"], sort_types=["hot"])
# collect.submission_from_user(user_names=["WorldNewsMods", "AcademicPattern2737", "EveningGalaxy"], sort_types=["hot"])

# print(os.path.dirname(__file__)) 

# test_columns = ["submission_id", "redditor_id", "created_at", "title", "text"]


supabase_client = login.supabase()
download = download.submission(supabase_client=supabase_client, db_name="FinInvMarket_submissions", paginate={"row_count": 5000})
download.to_img()
# download.to_json(columns = "all", file_name="all", file_path="test")

# fetch = fetch.user(supabase_client=supabase_client, db_name="test_redditor")

# print(fetch.name(limit=10))




