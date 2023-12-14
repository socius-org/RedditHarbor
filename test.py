from dock.pipeline import collect
import login 
import os 

reddit_client = login.reddit()
supabase_client = login.supabase()

DB_CONFIG = {
        "user": "test_redditor",
        "submission": "test_submission",
        "comment": "test_comment",
    }

collect = collect(reddit=reddit_client, supabase=supabase_client, db_config=DB_CONFIG)
# collect.subreddit_submission(subreddits=["AskReddit"], sort_types=["new"])
# collect.subreddit_comment(subreddits=["AskReddit"], sort_types=["new"])

collect.comment_from_user(user_names=["WorldNewsMods", "AcademicPattern2737", "EveningGalaxy"], sort_types=["hot"])

# print(os.path.dirname(__file__)) 
