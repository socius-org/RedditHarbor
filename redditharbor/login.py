import os
from dotenv import load_dotenv

load_dotenv()
from supabase import create_client, Client
import praw
from rich.console import Console

console = Console()


def create_empty_env_file():
    """
    Create an empty .env file if it does not exist.
    """
    if not os.path.isfile(".env"):
        with open(".env", "w") as env_file:
            env_file.write("")


def save_credentials_to_env(service_name: str, credentials: dict):
    """
    Save credentials to the .env file.

    Parameters:
        service_name (str): Name of the service (e.g., "SUPABASE" or "REDDIT").
        credentials (dict): Dictionary containing key-value pairs of credentials.
    """
    with open(".env", "r") as env_file:
        lines = env_file.readlines()

    # Remove all lines related to the specified service, including the comment line
    new_lines = [
        line
        for line in lines
        if not line.startswith(f"# {service_name} credentials")
        and not line.startswith(f"{service_name.upper()}_")
    ]

    # Add new credentials to the end of the file
    new_lines.append(f"\n# {service_name} credentials\n")
    for key, value in credentials.items():
        new_lines.append(f"{service_name.upper()}_{key}={value}\n")

    with open(".env", "w") as env_file:
        env_file.writelines(new_lines)


def load_credentials_from_env(service_name: str):
    """
    Load credentials from the .env file.

    Parameters:
        service_name (str): Name of the service (e.g., "SUPABASE" or "REDDIT").

    Returns:
        dict: Dictionary containing key-value pairs of credentials.
    """
    credentials = {}
    prefix = service_name.upper() + "_"

    for key, value in os.environ.items():
        if key.startswith(prefix):
            credentials[key[len(prefix) :]] = value

    return credentials


def reddit(
    public_key: str = None, secret_key: str = None, user_agent: str = None
) -> praw.Reddit:
    """
    Connect to the Reddit API using the provided credentials or those stored in the .env file.

    Parameters:
        public_key (str, optional): The public key of your Reddit API application.
        secret_key (str, optional): The secret key of your Reddit API application.
        user_agent (str, optional): The user agent identifying your application.
            A user_agent header is a string of text that is sent with HTTP requests to identify 
            the program making the request. It is recommended to use the following format:  
            "<Institution>:<ResearchProject> (by /u/YourRedditUserName)". 
            For example, "LondonSchoolofEconomics:Govt&Economics (by /u/econ101)"

    Returns:
        praw.Reddit: An instance of the Reddit API client if the connection is successful, else None.
    """

    create_empty_env_file()

    # Try to load existing credentials from the .env file
    existing_credentials = load_credentials_from_env("REDDIT")

    # Use provided parameters if available, otherwise use existing credentials
    public_key = public_key or existing_credentials.get("PUBLIC")
    secret_key = secret_key or existing_credentials.get("SECRET")
    user_agent = user_agent or existing_credentials.get("USER_AGENT")

    try:
        reddit_client = praw.Reddit(
            client_id=public_key, client_secret=secret_key, user_agent=user_agent
        )

        # Currently, there seems to be no method for checking whether API access is authorized
        submission = reddit_client.submission(
            url="https://www.reddit.com/r/reddit/comments/sphocx/test_post_please_ignore/"
        )

        if submission.selftext is not None:
            # Check if new credentials are provided before saving to .env
            if any((public_key, secret_key, user_agent)):
                if any(
                    existing_credentials.get(key) != value
                    for key, value in {
                        "PUBLIC": public_key,
                        "SECRET": secret_key,
                        "USER_AGENT": user_agent,
                    }.items()
                ):
                    console.log("[bold green]Connected to Reddit successfully.")
                    # Save the credentials to the .env file
                    save_credentials_to_env(
                        "REDDIT",
                        {
                            "PUBLIC": public_key,
                            "SECRET": secret_key,
                            "USER_AGENT": user_agent,
                        },
                    )
                    console.log("[bold yellow]Saving Reddit credentials to .env file.")
                else:
                    console.log("[bold yellow]Using existing Reddit credentials.")
                    console.log("[bold green]Connected to Reddit successfully.")
        return reddit_client

    except Exception as e:
        console.log(f"[bold red]Failed to connect to Reddit.[/] Error: {str(e)}")
        return None


def supabase(url: str = None, private_key: str = None) -> Client:
    """
    Connect to the Supabase database using the provided credentials or those stored in the .env file.

    Parameters:
        url (str, optional): The URL of your Supabase project.
        private_key (str, optional): The private key of your Supabase project.

    Returns:
        Client: An instance of the Supabase client if the connection is successful, else None.
    """

    create_empty_env_file()

    # Try to load existing credentials from the .env file
    existing_credentials = load_credentials_from_env("SUPABASE")

    # Use provided parameters if available, otherwise use existing credentials
    url = url or existing_credentials.get("URL")
    private_key = private_key or existing_credentials.get("KEY")

    try:
        supabase_client: Client = create_client(url, private_key)
        # Check if new credentials are provided before saving to .env
        if any((url, private_key)):
            if any(
                existing_credentials.get(key) != value
                for key, value in {"URL": url, "KEY": private_key}.items()
            ):
                console.log("[bold green]Connected to Supabase successfully.")
                # Save the credentials to the .env file
                save_credentials_to_env("SUPABASE", {"URL": url, "KEY": private_key})
                console.log("[bold yellow]Saving Supabase credentials to .env file.")
            else:
                console.log("[bold yellow]Using existing Supabase credentials.")
                console.log("[bold green]Connected to Supabase successfully.")
        return supabase_client

    except Exception as e:
        console.log(f"[bold red]Failed to connect to Supabase.[/] Error: {str(e)}")
        return None
