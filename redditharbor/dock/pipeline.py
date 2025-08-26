import os
import logging.config
from typing import List, Tuple, Optional, Dict, Any
import datetime
import praw
import supabase
from rich.console import Console
from rich.traceback import install
from rich.progress import track
import threading
from threading import Event
import time

console = Console(record=True)
install()

logging.config.dictConfig({"version": 1, "disable_existing_loggers": True})


class collect:
    def __init__(
        self,
        reddit_client: praw.Reddit,
        supabase_client: supabase.Client,
        db_config: dict = None,
    ):
        """
        Initialize the Collect instance for collecting data from Reddit and storing it in Supabase.

        Args:
            reddit_client (praw.Reddit): The Reddit client used for interacting with Reddit's API.
            supabase_client (supabase.Client): The Supabase client used for database interaction.
            db_config (dict, optional): A dictionary containing configuration details for database tables.
                It should include keys 'user', 'submission', and 'comment' for respective table names.

        Raises:
            ValueError: If db_config is not provided.

        Note:
            The method also checks for the existence of the 'error_log' folder and creates it if not present.
        """
        if db_config is None:
            raise ValueError("Invalid input: db_config must be provided.")
        
        self.reddit = reddit_client
        self.supabase = supabase_client

        self.redditor_db_config = db_config["user"]
        self.submission_db_config = db_config["submission"]
        self.comment_db_config = db_config["comment"]

        self.redditor_db = self.supabase.table(self.redditor_db_config)
        self.submission_db = self.supabase.table(self.submission_db_config)
        self.comment_db = self.supabase.table(self.comment_db_config)

        # Initialize PII components as None - will be loaded on demand
        self.pii_analyzer = None
        self.pii_anonymizer = None

        # Check and create "error_log" folder
        self.error_log_path = os.path.join(os.getcwd(), "error_log")
        os.makedirs(self.error_log_path, exist_ok=True)

    def _initialize_pii_tools(self):
        """
        Lazily initialize PII detection and anonymization tools.
        Downloads required spacy model if not available.
        """
        if self.pii_analyzer is not None:
            return  # Already initialized
        
        try:
            from presidio_analyzer import AnalyzerEngine
            from presidio_anonymizer import AnonymizerEngine
            import spacy
            
            # Try to load the spacy model
            try:
                spacy.load("en_core_web_lg")
            except OSError:
                # Model not found, attempt to download it
                import subprocess
                import sys
                
                console.log("[yellow]SpaCy model 'en_core_web_lg' not found. Downloading...[/yellow]")
                try:
                    subprocess.check_call(
                        [sys.executable, "-m", "spacy", "download", "en_core_web_lg"],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.STDOUT
                    )
                    console.log("[green]Successfully downloaded en_core_web_lg[/green]")
                except subprocess.CalledProcessError:
                    raise RuntimeError(
                        "Failed to download spaCy model automatically.\n"
                        "Please install it manually by running:\n"
                        "    python -m spacy download en_core_web_lg"
                    )
            
            self.pii_analyzer = AnalyzerEngine()
            self.pii_anonymizer = AnonymizerEngine()
            
        except ImportError as e:
            raise ImportError(
                "PII masking requires additional dependencies. "
                "Please install with: pip install redditharbor[pii]"
            ) from e

    def _check_redditor_exists(self, redditor_id: str) -> bool:
        """Check if a redditor exists in the database."""
        result = (
            self.redditor_db.select("redditor_id")
            .eq("redditor_id", redditor_id)
            .execute()
            .dict()["data"]
        )
        return len(result) == 1

    def _check_submission_exists(self, submission_id: str) -> bool:
        """Check if a submission exists in the database."""
        result = (
            self.submission_db.select("submission_id")
            .eq("submission_id", submission_id)
            .execute()
            .dict()["data"]
        )
        return len(result) == 1

    def _check_comment_exists(self, comment_id: str) -> bool:
        """Check if a comment exists in the database."""
        result = (
            self.comment_db.select("comment_id")
            .eq("comment_id", comment_id)
            .execute()
            .dict()["data"]
        )
        return len(result) == 1

    def _check_submission_comments_exist(self, submission_id: str) -> bool:
        """Check if comments for a submission exist in the database."""
        result = (
            self.comment_db.select("link_id")
            .eq("link_id", submission_id)
            .execute()
            .dict()["data"]
        )
        return len(result) >= 1

    def _mask_text_pii(self, text: str, language: str = "en") -> str:
        """Mask PII in text using presidio."""
        if not text:
            return text
        
        self._initialize_pii_tools()
        pii_results = self.pii_analyzer.analyze(
            text=text, language=language, return_decision_process=False
        )
        return self.pii_anonymizer.anonymize(
            text=text, analyzer_results=pii_results
        ).text

    def redditor_data(self, praw_models: praw.models, insert: bool) -> Tuple[str, bool]:
        """
        Collects and stores data related to a specific Redditor.

        Args:
            praw_models (praw.models): An object containing praw models.
            insert (bool): Insert redditor data to DB. 

        Returns:
            Tuple[str, bool]: A tuple containing the unique identifier of the Redditor collected and a boolean indicating whether the Redditor was inserted in the database.
        """
        redditor_inserted = False
        redditor = praw_models.author

        if not insert:
            # Early return when not inserting
            if hasattr(redditor, "id"):
                return redditor.id, False
            elif hasattr(redditor, "name") and redditor.is_suspended:
                return f"suspended:{redditor.name}", False
            elif redditor is None:
                return "deleted", False

        # Handle insertion logic
        if hasattr(redditor, "id"):
            redditor_id = redditor.id
            
            if self._check_redditor_exists(redditor_id):
                console.log(
                    f"Redditor [bold red]{redditor_id}[/] already in DB-{self.redditor_db_config}"
                )
                return redditor_id, redditor_inserted
            
            console.log(
                f"Redditor [bold red]{redditor_id}[/] not in DB. Adding to DB-{self.redditor_db_config}"
            )
            
            # Build redditor data
            name = redditor.name
            created_at = datetime.datetime.fromtimestamp(redditor.created_utc).isoformat()
            karma = {
                "comment": redditor.comment_karma,
                "link": redditor.link_karma,
                "awardee": redditor.awardee_karma,
                "awarder": redditor.awarder_karma,
                "total": redditor.total_karma,
            }
            is_gold = redditor.is_gold

            # Handle moderator status
            is_moderator = None
            if redditor.is_mod:
                is_moderator = {}
                for mod in redditor.moderated():
                    is_moderator[mod.name] = [
                        mod.display_name,
                        mod.subscribers,
                    ]

            # Handle trophies
            trophy = None
            trophies = list(redditor.trophies())
            if trophies:
                trophy = {
                    "list": [t.name for t in trophies],
                    "count": len(trophies)
                }

            removed = "active"

        else:  # Suspended or Deleted
            if hasattr(redditor, "name") and redditor.is_suspended:
                name = redditor.name
                
                # Check if user was previously active
                name_filter = (
                    self.redditor_db.select("name")
                    .eq("name", name)
                    .execute()
                    .dict()["data"]
                )
                
                if len(name_filter) == 1:  # Was Active in the Past, but Suspended
                    redditor_id = name_filter[0].get("redditor_id", f"suspended:{name}")
                    console.log(
                        f"Redditor [bold red]{redditor_id}[/] already in DB-{self.redditor_db_config}. Updating removed status"
                    )
                    self.redditor_db.update({"removed": "suspended"}).eq("name", name).execute()
                    return redditor_id, redditor_inserted
                
                # New suspended user
                redditor_id = f"suspended:{name}"
                console.log(
                    f"Redditor [bold red]{redditor_id}[/] not in DB-{self.redditor_db_config}. Adding to DB with limited data"
                )
                created_at = None
                karma = {
                    "awardee": redditor.awardee_karma,
                    "awarder": redditor.awarder_karma,
                    "total": redditor.total_karma,
                }
                is_gold = None
                is_moderator = None
                trophy = None
                removed = "suspended"
                
            elif redditor is None:  # Deleted
                return "deleted", redditor_inserted

        row = {
            "redditor_id": redditor_id,
            "name": name,
            "created_at": created_at,
            "karma": karma,
            "is_gold": is_gold,
            "is_mod": is_moderator,
            "trophy": trophy,
            "removed": removed,
        }

        self.redditor_db.insert(row).execute()
        return redditor_id, True

    def submission_data(
        self,
        submission: praw.models.reddit.submission.Submission,
        mask_pii: bool,
        insert_redditor: bool = True,
    ) -> Tuple[str, int, int]:
        """
        Collects and stores submissions and associated users in a specified subreddit.

        Args:
            submission (praw.models.reddit.submission.Submission): The praw Submission object representing the submission.
            mask_pii (bool): Whether to mask PII in submission text.
            insert_redditor (bool): Whether to insert redditor data.

        Returns:
            Tuple[str, int, int]: A tuple containing the submission id, the count of inserted submissions and the count of inserted Redditors.
        """
        accessed_at = datetime.datetime.utcnow()
        submission_id = submission.id
        
        if self._check_submission_exists(submission_id):
            console.log(
                f"Submission [bold red]{submission_id}[/] already in DB-{self.submission_db_config}"
            )
            return submission_id, False, False

        console.log(
            f"Submission [bold red]{submission_id}[/] not in DB. Adding to DB-{self.submission_db_config}"
        )

        redditor_id, redditor_inserted = self.redditor_data(submission, insert=insert_redditor)
        created_at = datetime.datetime.fromtimestamp(submission.created_utc)
        title = submission.title

        # Handle selftext and PII masking
        selftext = submission.selftext
        if mask_pii and selftext:
            selftext = self._mask_text_pii(selftext)

        subreddit = submission.subreddit.display_name
        permalink = f"https://www.reddit.com{submission.permalink}"
        
        # Handle attachments
        attachment = None
        if submission.is_reddit_media_domain:
            if submission.is_video:
                attachment = {"video": submission.url}
            elif ".jpg" in submission.url:
                attachment = {"jpg": submission.url}
            elif ".png" in submission.url:
                attachment = {"png": submission.url}
            elif ".gif" in submission.url:
                attachment = {"gif": submission.url}
        elif not submission.is_self:
            attachment = {"url": submission.url}

        # Handle polls
        poll = None
        if hasattr(submission, "poll_data"):
            vote_ends_at = datetime.datetime.fromtimestamp(
                submission.poll_data.voting_end_timestamp / 1000
            )
            options = submission.poll_data.options
            Options = {str(option): "unavailable" for option in options}
            
            poll = {
                "total_vote_count": submission.poll_data.total_vote_count,
                "vote_ends_at": vote_ends_at.isoformat(timespec="seconds"),
                "options": Options,
                "closed": vote_ends_at <= datetime.datetime.utcnow(),
            }
            
            if poll["closed"]:
                for option in options:
                    Options[str(option)] = str(option.vote_count)

        # Handle flairs
        flair = {
            "link": submission.link_flair_text,
            "author": submission.author_flair_text,
        }

        # Handle awards
        awards = {
            "total_awards_count": submission.total_awards_received,
            "total_awards_price": 0,
            "list": None,
        }
        
        if submission.total_awards_received > 0:
            awards_list = {}
            total_awards_price = 0
            for award in submission.all_awardings:
                awards_list[award["name"]] = [award["count"], award["coin_price"]]
                total_awards_price += award["coin_price"] * award["count"]
            awards["total_awards_price"] = total_awards_price
            awards["list"] = awards_list

        score = {accessed_at.isoformat(timespec="seconds"): submission.score}
        upvote_ratio = {accessed_at.isoformat(timespec="seconds"): submission.upvote_ratio}
        num_comments = {accessed_at.isoformat(timespec="seconds"): submission.num_comments}

        edited = submission.edited is not False
        archived = submission.archived
        removed = submission.removed_by_category is not None

        row = {
            "submission_id": submission_id,
            "redditor_id": redditor_id,
            "created_at": created_at.isoformat(),
            "title": title,
            "text": selftext,
            "subreddit": subreddit,
            "permalink": permalink,
            "attachment": attachment,
            "poll": poll,
            "flair": flair,
            "awards": awards,
            "score": score,
            "upvote_ratio": upvote_ratio,
            "num_comments": num_comments,
            "edited": edited,
            "archived": archived,
            "removed": removed,
        }

        self.submission_db.insert(row).execute()
        return submission_id, True, redditor_inserted

    def comment_data(
        self,
        comments: List[praw.models.reddit.comment.Comment],
        mask_pii: bool,
        insert_redditor: bool = True,
    ) -> Tuple[int, int]:
        """
        Collects and stores comment data associated with a list of comments.

        Args:
            comments (List[praw.models.reddit.comment.Comment]): A list of praw Comment objects to collect and store.
            mask_pii (bool): Whether to mask PII in comment text.
            insert_redditor (bool): Whether to insert redditor data.

        Returns:
            Tuple[int, int]: A tuple containing the count of inserted comments and the count of inserted Redditors.
        """
        comment_inserted_count = 0
        redditor_inserted_count = 0

        for comment in comments:
            accessed_at = datetime.datetime.utcnow()
            try:
                comment_id = comment.id
                
                if self._check_comment_exists(comment_id):
                    console.log(
                        f"Comment [bold red]{comment_id}[/] already in DB-{self.comment_db_config}"
                    )
                    continue
                
                console.log(
                    f"Adding comment [bold red]{comment_id}[/] to DB-{self.comment_db_config}"
                )
                
                link_id = comment.link_id.replace("t3_", "")
                subreddit = str(comment.subreddit)
                parent_id = comment.parent_id
                
                redditor_id, redditor_inserted = self.redditor_data(
                    comment, insert=insert_redditor
                )
                
                if redditor_inserted:
                    redditor_inserted_count += 1

                created_at = datetime.datetime.fromtimestamp(comment.created_utc)

                # Handle body text
                selfbody = comment.body
                removed = None
                
                if selfbody == "[deleted]":
                    selfbody = None
                    removed = "deleted"
                elif selfbody == "[removed]":
                    selfbody = None
                    removed = "removed"
                elif mask_pii and selfbody:
                    selfbody = self._mask_text_pii(selfbody)

                edited = comment.edited is not False
                score = {accessed_at.isoformat(timespec="seconds"): comment.score}

                row = {
                    "comment_id": comment_id,
                    "link_id": link_id,
                    "subreddit": subreddit,
                    "parent_id": parent_id,
                    "redditor_id": redditor_id,
                    "created_at": created_at.isoformat(),
                    "body": selfbody,
                    "score": score,
                    "edited": edited,
                    "removed": removed,
                }

                self.comment_db.insert(row).execute()
                comment_inserted_count += 1

            except Exception as error:
                console.log(f"t1_{comment.id}: [bold red]{error}[/]")
                console.print_exception()
                console.save_html(
                    os.path.join(self.error_log_path, f"t1_{comment.id}.html")
                )
                continue

        return comment_inserted_count, redditor_inserted_count

    def subreddit_submission(
        self,
        subreddits: List[str],
        sort_types: List[str],
        limit: int = 10,
        mask_pii: bool = False,
    ) -> None:
        """
        Lazy collection. Collects and stores submissions and associated users in specified subreddits.

        Args:
            subreddits (List[str]): A list of subreddit names to collect submissions from.
            sort_types (List[str]): A list of sorting types for submissions (e.g., 'hot', 'new', 'rising', 'top', 'controversial').
            limit (int, optional): The maximum number of submissions to collect for each subreddit. Defaults to 10. Set to None to fetch maximum number of submissions. 
            mask_pii (bool, optional): Mask (or anonymise) personally identifiable information (PII). Defaults to False.

        Returns:
            None. Prints the count of collected submissions and user data to the console.
        """
        with console.status(
            "[bold green]Collecting submissions and users from subreddit(s)...",
            spinner="aesthetic",
        ):
            total_submission_inserted_count = 0
            total_redditor_inserted_count = 0
            
            for subreddit in subreddits:
                console.print(f"[bold]subreddit: {subreddit}", justify="center")
                r_ = self.reddit.subreddit(subreddit)
                
                for sort_type in sort_types:
                    console.print(sort_type, justify="center")
                    
                    for submission in getattr(r_, sort_type)(limit=limit):
                        try:
                            submission_id, submission_inserted, redditor_inserted = self.submission_data(
                                submission=submission, mask_pii=mask_pii
                            )

                            if submission_inserted:
                                total_submission_inserted_count += 1
                            if redditor_inserted:
                                total_redditor_inserted_count += 1

                        except Exception as error:
                            console.log(f"t3_{submission_id}: [bold red]{error}[/]")
                            console.print_exception()
                            console.save_html(
                                os.path.join(self.error_log_path, f"t3_{submission_id}.html")
                            )
                            continue

        console.print(
            f"[bold green]{total_submission_inserted_count} submission and {total_redditor_inserted_count} user data collected from subreddit(s) {subreddits}"
        )

    def subreddit_comment(
        self,
        subreddits: List[str],
        sort_types: List[str],
        limit: int = 10,
        level: Optional[int] = 1,
        mask_pii: bool = False,
    ) -> None:
        """
        Lazy collection. Collects and stores comments and associated users in specified subreddits.

        Args:
            subreddits (List[str]): A list of subreddit names to collect comments from.
            sort_types (List[str]): A list of sorting types for submissions (e.g., 'hot', 'new', 'rising', 'top', 'controversial').
            limit (int, optional): The maximum number of submissions to collect comments from (for each subreddit). Defaults to 10. Set to None to fetch maximum number of submissions. 
            level (int, optional): The depth to which comment replies should be fetched. Defaults to 1. Set to None to fetch all comment replies. 
            mask_pii (bool, optional): Mask (or anonymise) personally identifiable information (PII). Defaults to False.

        Returns:
            None. Prints the count of collected comments and user data to the console.
        """
        with console.status(
            "[bold green]Collecting comments and users from subreddit(s)...",
            spinner="aesthetic",
        ):
            total_comment_inserted_count = 0
            total_redditor_inserted_count = 0

            for subreddit in subreddits:
                console.print(f"[bold]subreddit: {subreddit}", justify="center")
                r_ = self.reddit.subreddit(subreddit)
                
                for sort_type in sort_types:
                    console.print(sort_type, justify="center")

                    for submission in getattr(r_, sort_type)(limit=limit):
                        try:
                            submission_id = submission.id

                            if self._check_submission_comments_exist(submission_id):
                                console.log(
                                    f"Submission Link [bold red]{submission_id}[/] already in DB-{self.comment_db_config}"
                                )
                                continue

                            submission.comments.replace_more(limit=level)
                            comments = submission.comments.list()
                            
                            comment_inserted_count, redditor_inserted_count = self.comment_data(
                                comments=comments, mask_pii=mask_pii
                            )
                            total_comment_inserted_count += comment_inserted_count
                            total_redditor_inserted_count += redditor_inserted_count

                        except Exception as error:
                            console.log(f"t3_{submission.id}: [bold red]{error}[/]")
                            console.print_exception()
                            console.save_html(
                                os.path.join(self.error_log_path, f"t3_{submission.id}.html")
                            )
                            continue

        console.print(
            f"[bold green]{total_comment_inserted_count} comment and {total_redditor_inserted_count} user data collected from subreddit(s) {subreddits}"
        )

    def subreddit_submission_and_comment(
        self,
        subreddits: List[str],
        sort_types: List[str],
        limit: int = 10,
        level: int = 1,
        mask_pii: bool = False,
    ) -> None:
        """
        Lazy collection. Collects and stores submissions, comments and associated users in specified subreddits.

        Args:
            subreddits (List[str]): A list of subreddit names to collect comments from.
            sort_types (List[str]): A list of sorting types for submissions (e.g., 'hot', 'new', 'rising', 'top', 'controversial').
            limit (int, optional): The maximum number of submissions to collect comments from (for each subreddit). Defaults to 10. Set to None to fetch maximum number of submissions. 
            level (int, optional): The depth to which comment replies should be fetched. Defaults to 1. Set to None to fetch all comment replies. 
            mask_pii (bool, optional): Mask (or anonymise) personally identifiable information (PII). Defaults to False.

        Returns:
            None. Prints the count of collected submissions, comments and user data to the console.
        """
        with console.status(
            "[bold green]Collecting submissions, comments and users from subreddit(s)...",
            spinner="aesthetic",
        ):
            total_submission_inserted_count = 0
            total_comment_inserted_count = 0
            total_redditor_inserted_count = 0

            for subreddit in subreddits:
                console.print(f"[bold]subreddit: {subreddit}", justify="center")
                r_ = self.reddit.subreddit(subreddit)
                
                for sort_type in sort_types:
                    console.print(sort_type, justify="center")
                    
                    for submission in getattr(r_, sort_type)(limit=limit):
                        try:
                            # Collect Submission
                            submission_id, submission_inserted, submission_redditor_inserted = self.submission_data(
                                submission=submission, mask_pii=mask_pii
                            )

                            if submission_inserted:
                                total_submission_inserted_count += 1
                            if submission_redditor_inserted:
                                total_redditor_inserted_count += 1

                            # Check if comments of submission were crawled
                            if self._check_submission_comments_exist(submission_id):
                                console.log(
                                    f"Submission Link [bold red]{submission_id}[/] already in DB-{self.comment_db_config}"
                                )
                                continue

                            submission.comments.replace_more(limit=level)
                            comments = submission.comments.list()
                            
                            comment_inserted_count, comment_redditor_inserted_count = self.comment_data(
                                comments=comments, mask_pii=mask_pii
                            )
                            total_comment_inserted_count += comment_inserted_count
                            total_redditor_inserted_count += comment_redditor_inserted_count

                        except Exception as error:
                            console.log(f"t3_{submission.id}: [bold red]{error}[/]")
                            console.print_exception()
                            console.save_html(
                                os.path.join(self.error_log_path, f"t3_{submission.id}.html")
                            )
                            continue

        console.print(
            f"[bold green]{total_submission_inserted_count} submission, {total_comment_inserted_count} comment, and {total_redditor_inserted_count} user data collected from subreddit(s) {subreddits}"
        )

    def submission_from_user(
        self,
        user_names: List[str],
        sort_types: List[str],
        limit: int = 10,
        mask_pii: bool = False,
    ) -> None:
        """
        Collects and stores submissions from specified user(s).

        Args:
            user_names (List[str]): A list of Reddit usernames from which to collect submissions.
            sort_types (List[str]): A list of sorting types for user's submissions (e.g., 'hot', 'new', 'rising', 'top', 'controversial').
            limit (int, optional): The maximum number of submissions to collect for each user. Defaults to 10.
            mask_pii (bool, optional): Mask (or anonymise) personally identifiable information (PII). Defaults to False.

        Returns:
            None. Prints the count of collected submission data to the console.
        """
        with console.status(
            "[bold green]Collecting submissions from specified user(s)...",
            spinner="aesthetic",
        ):
            total_submission_inserted_count = 0
            
            for user_name in user_names:
                console.print(f"[bold]user: {user_name}", justify="center")
                redditor = self.reddit.redditor(user_name)
                
                for sort_type in sort_types:
                    console.print(sort_type, justify="center")
                    
                    try:
                        for submission in getattr(redditor.submissions, sort_type)(limit=limit):
                            try:
                                submission_id, submission_inserted, _ = self.submission_data(
                                    submission=submission, mask_pii=mask_pii
                                )
                                if submission_inserted:
                                    total_submission_inserted_count += 1
                                    
                            except Exception as error:
                                console.log(f"t3_{submission_id}: [bold red]{error}[/]")
                                console.print_exception()
                                console.save_html(
                                    os.path.join(self.error_log_path, f"t3_{submission_id}.html")
                                )
                                continue

                    except Exception as error:
                        console.log(f"user_{user_name}: [bold red]{error}[/]")
                        console.print_exception()
                        console.save_html(
                            os.path.join(self.error_log_path, f"user_{user_name}.html")
                        )
                        continue
                        
        console.print(
            f"[bold green]{total_submission_inserted_count} submission data collected from {len(user_names)} user(s)"
        )

    def comment_from_user(
        self,
        user_names: List[str],
        sort_types: List[str],
        limit: int = 10,
        mask_pii: bool = False,
    ) -> None:
        """
        Collects and stores comments from specified user(s).

        Args:
            user_names (List[str]): A list of Reddit usernames from which to collect comments. Must to user name, not id. 
            sort_types (List[str]): A list of sorting types for user's comments (e.g., 'hot', 'new', 'rising', 'top', 'controversial').
            limit (int, optional): The maximum number of comments to collect for each user. Defaults to 10.
            mask_pii (bool, optional): Mask (or anonymise) personally identifiable information (PII). Defaults to False.

        Returns:
            None. Prints the count of collected comment data to the console.
        """
        with console.status(
            "[bold green]Collecting comments from user(s)...", spinner="aesthetic"
        ):
            total_comment_inserted_count = 0
            
            for user_name in user_names:
                console.print(f"[bold]user: {user_name}", justify="center")
                redditor = self.reddit.redditor(user_name)
                
                for sort_type in sort_types:
                    console.print(sort_type, justify="center")
                    
                    try:
                        comments = list(getattr(redditor.comments, sort_type)(limit=limit))
                        comment_inserted_count, _ = self.comment_data(
                            comments=comments, mask_pii=mask_pii
                        )
                        total_comment_inserted_count += comment_inserted_count
                        
                    except Exception as error:
                        console.log(f"user_{user_name}: [bold red]{error}[/]")
                        console.print_exception()
                        console.save_html(
                            os.path.join(self.error_log_path, f"user_{user_name}.html")
                        )
                        continue

        console.print(
            f"[bold green]{total_comment_inserted_count} comment data collected from {len(user_names)} user(s)"
        )

    def submission_by_keyword(
        self, subreddits: List[str], query: str, limit: int = 10, mask_pii: bool = False
    ) -> None:
        """
        Collects and stores submissions with specified keywords from given subreddits.

        You can customize the search behavior by leveraging boolean operators:
        - AND: Requires all connected words to be present in the search results.
        E.g., 'cats AND dogs' returns results with both "cats" and "dogs."
        - OR: Requires at least one of the connected words to match.
        E.g., 'cats OR dogs' returns results with either "cats" or "dogs."
        - NOT: Excludes results containing specific words.
        E.g., 'cats NOT dogs' returns results with "cats" but without "dogs."
        - Using parentheses ( ) groups parts of a search together.

        Note: Be cautious with multiple boolean operators; use parentheses to specify behavior.

        Args:
            subreddits (List[str]): List of subreddit names to collect submissions from.
            query (str): Search terms.
            limit (int, optional): Maximum number of submissions to collect. Defaults to 10.
            mask_pii (bool, optional): Mask (anonymise) personally identifiable information (PII). Defaults to False.

        Returns:
            None. Prints the count of collected submissions data to the console.
        """
        with console.status(
            "[bold green]Collecting submissions with specified keyword(s)...",
            spinner="aesthetic",
        ):
            total_submission_inserted_count = 0
            
            for subreddit in subreddits:
                console.print(f"[bold]subreddit: {subreddit}", justify="center")
                r_ = self.reddit.subreddit(subreddit)
                
                for submission in r_.search(query, sort="relevance", limit=limit):
                    try:
                        submission_id, submission_inserted, _ = self.submission_data(
                            submission=submission,
                            mask_pii=mask_pii,
                            insert_redditor=False,
                        )

                        if submission_inserted:
                            total_submission_inserted_count += 1

                    except Exception as error:
                        console.log(f"t3_{submission_id}: [bold red]{error}[/]")
                        console.print_exception()
                        console.save_html(
                            os.path.join(self.error_log_path, f"t3_{submission_id}.html")
                        )
                        continue

        console.print(
            f"[bold green]{total_submission_inserted_count} submission data collected from subreddit(s) {subreddits} with query='{query}'"
        )

    def comment_from_submission(
        self,
        submission_ids: List[str],
        level: Optional[int] = 1,
        mask_pii: bool = False,
    ) -> None:
        """
        Collects and stores comments from specified submission id(s).
        
        Parameters:
            submission_ids (List[str]): A list of submission IDs from which to collect comments.
            level (Optional[int]): The depth of comments to collect. Defaults to 1.
            mask_pii (bool, optional): Mask (or anonymise) personally identifiable information (PII). Defaults to False.

        Returns:
            None
        """
        with console.status(
            "[bold green]Collecting comments from submission id(s)...",
            spinner="aesthetic",
        ):
            total_comment_inserted_count = 0
            
            for submission_id in submission_ids:
                console.print(f"[bold]submission: {submission_id}", justify="center")
                submission = self.reddit.submission(submission_id)
                
                try:
                    # Check if comments of submission were crawled
                    if self._check_submission_comments_exist(submission_id):
                        console.log(
                            f"Submission Link [bold red]{submission_id}[/] already in DB-{self.comment_db_config}"
                        )
                        continue

                    submission.comments.replace_more(limit=level)
                    comments = submission.comments.list()
                    comment_inserted_count, _ = self.comment_data(
                        comments=comments, mask_pii=mask_pii, insert_redditor=False
                    )
                    total_comment_inserted_count += comment_inserted_count
                    
                except Exception as error:
                    console.log(f"t3_{submission.id}: [bold red]{error}[/]")
                    console.print_exception()
                    console.save_html(
                        os.path.join(self.error_log_path, f"t3_{submission.id}.html")
                    )
                    continue
                    
        console.print(
            f"[bold green]{total_comment_inserted_count} comment data collected from {len(submission_ids)} submission(s)"
        )


class update:
    """
    Class to update data from Reddit to Supabase periodically.
    
    Args:
        reddit_client (praw.Reddit): Reddit client.
        supabase_client (supabase.Client): Supabase client.
        db_config (dict, optional): Database configuration. Defaults to None.
    """

    def __init__(
        self,
        reddit_client: praw.Reddit,
        supabase_client: supabase.Client,
        db_config: dict = None,
    ) -> None:
        if db_config is None:
            raise ValueError("Invalid input: db_config must be provided.")
            
        self.reddit = reddit_client
        self.supabase = supabase_client

        self.redditor_db_config = db_config["user"]
        self.submission_db_config = db_config["submission"]
        self.comment_db_config = db_config["comment"]

        self.redditor_db = self.supabase.table(self.redditor_db_config)
        self.submission_db = self.supabase.table(self.submission_db_config)
        self.comment_db = self.supabase.table(self.comment_db_config)

        # Get Row Counts for non-archived data
        self.submission_row_count = (
            self.submission_db.select("archived", count="exact")
            .eq("archived", False)
            .execute()
            .count
        )

        # Event to signal the threads to stop
        self.stop_event = Event()

    def submission(self):
        """
        Update submission data from Reddit to Supabase.
        """
        page_size = 1000
        page_numbers = (self.submission_row_count // page_size) + (
            1 if self.submission_row_count % page_size != 0 else 0
        )
        start_row = 0
        end_row = min(self.submission_row_count, page_size)

        for page in range(1, page_numbers + 1):
            if page > 1:
                start_row += page_size
                end_row = min(start_row + page_size, self.submission_row_count)

            columns = {"submission_id", "score", "upvote_ratio", "num_comments"}
            paginated_submission = (
                self.submission_db.select(*columns)
                .eq("archived", False)
                .order("created_at", desc=True)
                .range(start_row, end_row)
                .execute()
                .model_dump()["data"]
            )

            for submission in track(
                paginated_submission,
                description=f"Updating submission in DB-{self.submission_db_config} {page}/{page_numbers}",
            ):
                submission_id = submission["submission_id"]
                score = submission["score"]
                upvote_ratio = submission["upvote_ratio"]
                num_comments = submission["num_comments"]

                accessed_at = datetime.datetime.utcnow()
                reddit_submission = self.reddit.submission(id=submission_id)

                score[accessed_at.isoformat(timespec="seconds")] = reddit_submission.score
                upvote_ratio[accessed_at.isoformat(timespec="seconds")] = reddit_submission.upvote_ratio
                num_comments[accessed_at.isoformat(timespec="seconds")] = reddit_submission.num_comments
                archived = reddit_submission.archived
                
                if archived:
                    console.print(f"{submission_id} is archived")

                self.submission_db.update(
                    {
                        "score": score,
                        "upvote_ratio": upvote_ratio,
                        "num_comments": num_comments,
                        "archived": archived,
                    }
                ).eq("submission_id", submission_id).execute()

    def run_task_with_interval(self, task: str, interval: int, duration: int) -> None:
        """
        Run the task with a specified interval and duration.
        
        Args:
            task (str): Task to perform. 
            interval (int): Time interval between tasks in seconds.
            duration (int): Duration for which the task should run in seconds.
        """
        loop_start = time.time()
        loop_end = loop_start + (duration if duration else float("inf"))
        update_count = 0

        while time.time() < loop_end and not self.stop_event.is_set():
            if task == "submission":
                start = time.time()
                self.submission()
                update_count += 1
                end = time.time()
                difference = int(end - start)
                
                if difference < interval:
                    console.log(
                        f"[bold green]Updated successfully[/] ({difference} seconds). Commencing next schedule in {interval-difference} seconds"
                    )
                    time.sleep(interval - difference)

        self.stop_event.set()
        console.print(
            f"[bold green]Processed {update_count} cycles of submission updates, each comprising {self.submission_row_count} submissions."
        )

    def schedule_task(self, task: str, duration: str) -> None:
        """
        Schedule the task with a specified duration and automatically determine the update time interval based on the Row Count.
        
        Args:
            task (str): Task to perform. Available tasks are 'submission'. 
            duration (str): Duration for which the task should run. Options are '1hr', '6hr', '12hr', and '1d'.
        """
        tasks = ["submission", "comment", "user"]
        
        if task not in tasks:
            raise ValueError(
                f"Invalid task type: {task}. Available tasks are 'submission', 'comment', and 'user'."
            )

        # Get Row Count
        if task == "submission":
            row_count = self.submission_row_count
        else:
            row_count = None
            raise NotImplementedError(f"Task '{task}' is not yet implemented.")

        # Automatically determine update time interval based on the Row Count
        if row_count <= 1000:
            interval = 10 * 60
        elif row_count <= 3000:
            interval = 30 * 60
        elif row_count <= 6000:
            interval = 60 * 60
        elif row_count <= 36000:
            interval = 6 * 60 * 60
        elif row_count <= 72000:
            interval = 12 * 60 * 60
        else:
            interval = 24 * 60 * 60

        duration_in_seconds = {
            "1hr": 60 * 60,
            "6hr": 6 * 60 * 60,
            "12hr": 12 * 60 * 60,
            "1d": 24 * 60 * 60,
        }

        duration_seconds = duration_in_seconds.get(duration)
        if not duration_seconds:
            raise ValueError(
                "Invalid duration interval. Available durations are '1hr', '6hr', '12hr', and '1d'."
            )

        threading.Thread(
            target=self.run_task_with_interval,
            args=(task, interval, duration_seconds),
            daemon=True,
        ).start()
        
        while not self.stop_event.is_set():
            time.sleep(0.01)