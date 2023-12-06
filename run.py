import login
from sync_pipeline import collect, console


if __name__ == "__main__":

    SUPABASE_URL = "<your-supabase-url>"
    SUPABASE_KEY = "<your-supabase-api-key>"

    REDDIT_PUBLIC = "<your-reddit-public-key>"
    REDDIT_SECRET = "<your-reddit-secret-key>"
    REDDIT_USER_AGENT = "<your-reddit-user-agent>"

    DB_CONFIG = {
        "redditor": "test_redditor",
        "submission": "test_submission",
        "comment": "test_comment",
    }

    reddit_client = login.reddit(
        public_key=REDDIT_PUBLIC, secret_key=REDDIT_SECRET, user_agent=REDDIT_USER_AGENT
    )
    supabase_client = login.supabase(url=SUPABASE_URL, private_key=SUPABASE_KEY)

    collect = collect(
        reddit=reddit_client, supabase=supabase_client, db_config=DB_CONFIG
    )

    # -------------------#

    """
    Collecting Submissions 
    
    Example 1: Collect 10 "hot" submissions of your own subreddit(s) of interest. 
    Suppose you are interested in subreddits "AskReddit" and "worldnews". 
    (Note: Remember to remove "r/" in front of the names of subreddits)  
    
    collection = ["AskReddit", "worldnews"]
    sort_types = ["hot"]
    number_of_submissions = 10 
    
    for subreddit in collection: 
        console.print(subreddit, justify="center")
        with console.status("[bold green]Collecting...") as status:
            for sort_type in sort_types:
                console.print(sort_type, justify="center")
                collect.submission_data(subreddit=subreddit, sort_type=sort_type, limit=number_of_submissions)
    
    
    Example 2: Collect ALL "hot" and "controversial" submissions from a predefined collection of subreddits 
    (Note: See subreddit_collections.py for all avaliable collections)
    
    from subreddit_collections import r_intLCurrentAffairs
    collection = r_intLCurrentAffairs
    sort_types = ["hot", "controversial"]
    number_of_submissions = None 
    
    for subreddit in collection: 
        console.print(subreddit, justify="center")
        with console.status("[bold green]Collecting...") as status:
            for sort_type in sort_types:
                console.print(sort_type, justify="center")
                collect.submission_data(subreddit=subreddit, sort_type=sort_type, limit=number_of_submissions)
    
    
    Example 3: Collect ALL comments of the submissions collected previously. 
    Setting number_of_comments to 1 would give you the top level comments. 
    Setting number_of_comments to 2 would give you the top and second level comments (comment and their replies).
    Setting number_of_comments to None would give you the entire list of comments. 
    (Note: Remember that you must collect and store submissions data first in your Supabase)
    
    number_of_comments = 1 
    
    with console.status("[bold green]Collecting...") as status:
        collect.comment_data(limit=number_of_comments)
    
    """
    from subreddit_collections import r_intLCurrentAffairs
    collection = r_intLCurrentAffairs
    sort_types = ["hot", "controversial"]
    number_of_submissions = None 
    
    for subreddit in collection: 
        console.print(subreddit, justify="center")
        with console.status("[bold green]Collecting...") as status:
            for sort_type in sort_types:
                console.print(sort_type, justify="center")
                collect.submission_data(subreddit=subreddit, sort_type=sort_type, limit=number_of_submissions)
