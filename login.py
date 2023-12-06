from supabase import create_client, Client
import praw
from rich.console import Console
console = Console()

def reddit(public_key: str, secret_key: str, user_agent: str) -> praw.Reddit:
    """
    Connect to the Reddit API using the provided credentials.

    Parameters:
        public_key (str): The public key of your Reddit API application.
        secret_key (str): The secret key of your Reddit API application.
        user_agent (str): The user agent identifying your application.
            A user_agent header is a string of text that is sent with HTTP requests to identify 
            the program making the request. It is recommended to use the following format:  
            "<Institution>:<ResearchProject> (by /u/YourRedditUserName)". 
            For example, "LondonSchoolofEconomics:Govt&Economics (by /u/nickshoh)")
    Returns:
        praw.Reddit: An instance of the Reddit API client if the connection is successful, else None.
    """
    try:
        reddit_client = praw.Reddit(
            client_id=public_key, client_secret=secret_key, user_agent=user_agent
        )

        # Currently, there seems to be no method for checking whether API access is authorized
        submission = reddit_client.submission(
            url="https://www.reddit.com/r/reddit/comments/sphocx/test_post_please_ignore/"
        )

        if submission.selftext is not None:
            console.log("[bold green]Connected to Reddit successfully.")
            return reddit_client

    except Exception as e:
        console.log(f"Failed to connect to Reddit. Error: {str(e)}")
        return None


def supabase(url: str, private_key: str) -> Client:
    """
    Connect to the Supabase database using the provided credentials.

    Parameters:
        url (str): The URL of your Supabase project.
        private_key (str): The private key of your Supabase project.

    Returns:
        Client: An instance of the Supabase client if the connection is successful, else None.
    """
    try:
        supabase_client: Client = create_client(url, private_key)
        console.log("[bold green]Connected to Supabase successfully.")
        return supabase_client
    except Exception as e:
        console.log(f"Failed to connect to Supabase. Error: {str(e)}")
        return None
