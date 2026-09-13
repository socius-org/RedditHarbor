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

from redditharbor import schema
from redditharbor.utils.updates import check_for_updates

console = Console(record=True)
install()

logging.config.dictConfig({"version": 1, "disable_existing_loggers": True})


def _timestamp() -> str:
    """Current UTC time in ISO format (seconds precision), used as the key of temporal metrics."""
    return datetime.datetime.utcnow().isoformat(timespec="seconds")


class collect:
    def __init__(
        self,
        reddit_client: praw.Reddit,
        supabase_client: supabase.Client,
        db_config: dict = None,
        columns: dict = None,
    ):
        """
        Initialize the Collect instance for collecting data from Reddit and storing it in Supabase.

        RedditHarbor only collects the columns you explicitly list in `columns` (data
        minimisation). Anything not listed is neither requested from Reddit nor stored.

        Args:
            reddit_client (praw.Reddit): The Reddit client used for interacting with Reddit's API.
            supabase_client (supabase.Client): The Supabase client used for database interaction.
            db_config (dict): A dictionary containing the database table names.
                It should include keys 'user', 'submission', and 'comment' for the tables
                configured in `columns`.
            columns (dict): A dictionary mapping 'user', 'submission' and/or 'comment' to
                the list of columns to collect for that table. A table that is omitted
                (or set to None) is not collected at all. The primary key of each table is
                always included. See `redditharbor.schema` for the available columns.

        Raises:
            ValueError: If db_config or columns is not provided, or if columns contains
                unknown table or column names.

        Note:
            The method also checks for the existence of the 'error_log' folder and creates it if not present.
        """
        if db_config is None:
            raise ValueError("Invalid input: db_config must be provided.")

        self.reddit = reddit_client
        self.supabase = supabase_client

        self.columns = schema.validate_columns(columns)
        self.user_columns = self.columns["user"]
        self.submission_columns = self.columns["submission"]
        self.comment_columns = self.columns["comment"]

        self.redditor_db_config = self._table_name(db_config, "user")
        self.submission_db_config = self._table_name(db_config, "submission")
        self.comment_db_config = self._table_name(db_config, "comment")

        # Table handles only exist for the tables you chose to collect.
        self.redditor_db = self._table("user", self.redditor_db_config)
        self.submission_db = self._table("submission", self.submission_db_config)
        self.comment_db = self._table("comment", self.comment_db_config)

        # Initialize PII components as None - will be loaded on demand
        self.pii_analyzer = None
        self.pii_anonymizer = None

        # Check and create "error_log" folder
        self.error_log_path = os.path.join(os.getcwd(), "error_log")
        os.makedirs(self.error_log_path, exist_ok=True)

        check_for_updates()

    def _table_name(self, db_config: dict, table: str) -> Optional[str]:
        """Return the database table name for `table`, or None if that table is not collected."""
        name = db_config.get(table)
        if self.columns[table] is not None and not name:
            raise ValueError(
                f"Invalid input: db_config must include a table name for '{table}' "
                f"because columns['{table}'] is configured."
            )
        return name

    def _table(self, table: str, table_name: Optional[str]):
        """Return a Supabase table handle for `table`, or None if that table is not collected."""
        if self.columns[table] is None:
            return None
        return self.supabase.table(table_name)

    def _require(self, table: str) -> List[str]:
        """Return the configured columns for `table`, raising if that table is not collected."""
        columns = self.columns[table]
        if columns is None:
            raise ValueError(
                f"No columns are configured for '{table}'. Add a '{table}' entry to `columns` "
                f"to collect {table} data (see redditharbor.schema)."
            )
        return columns

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
            .data
        )
        return len(result) == 1

    def _check_submission_exists(self, submission_id: str) -> bool:
        """Check if a submission exists in the database."""
        result = (
            self.submission_db.select("submission_id")
            .eq("submission_id", submission_id)
            .execute()
            .data
        )
        return len(result) == 1

    def _check_comment_exists(self, comment_id: str) -> bool:
        """Check if a comment exists in the database."""
        result = (
            self.comment_db.select("comment_id")
            .eq("comment_id", comment_id)
            .execute()
            .data
        )
        return len(result) == 1

    def _check_submission_comments_exist(self, submission_id: str) -> bool:
        """
        Check if comments for a submission exist in the database.

        This shortcut relies on the `link_id` column of the comment table. If `link_id`
        is not collected, it always returns False and de-duplication falls back to the
        per-comment `comment_id` check.
        """
        if self.comment_columns is None or "link_id" not in self.comment_columns:
            return False
        result = (
            self.comment_db.select("link_id")
            .eq("link_id", submission_id)
            .execute()
            .data
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

    @staticmethod
    def _moderated_subreddits(redditor) -> Optional[Dict[str, list]]:
        """Subreddits moderated by the redditor, or None if they moderate nothing."""
        if not redditor.is_mod:
            return None
        return {
            mod.name: [mod.display_name, mod.subscribers]
            for mod in redditor.moderated()
        }

    @staticmethod
    def _trophies(redditor) -> Optional[Dict[str, Any]]:
        """Trophies of the redditor, or None if they have none."""
        trophies = list(redditor.trophies())
        if not trophies:
            return None
        return {"list": [t.name for t in trophies], "count": len(trophies)}

    def redditor_data(self, praw_models: praw.models, insert: bool) -> Tuple[str, bool]:
        """
        Collects and stores data related to a specific Redditor.

        Only the columns configured in columns['user'] are fetched and stored. If no user
        columns are configured, the redditor is never inserted; only its identifier is
        returned so that submissions and comments can reference it.

        Args:
            praw_models (praw.models): An object containing praw models.
            insert (bool): Insert redditor data to DB.

        Returns:
            Tuple[str, bool]: A tuple containing the unique identifier of the Redditor collected and a boolean indicating whether the Redditor was inserted in the database.
        """
        redditor = praw_models.author
        columns = self.user_columns
        insert = insert and columns is not None
        store_name = columns is not None and "name" in columns

        if redditor is None:  # Deleted account
            return "deleted", False

        if hasattr(redditor, "id"):  # Active account
            redditor_id = redditor.id
            if not insert:
                return redditor_id, False

            if self._check_redditor_exists(redditor_id):
                console.log(
                    f"Redditor [bold red]{redditor_id}[/] already in DB-{self.redditor_db_config}"
                )
                return redditor_id, False

            console.log(
                f"Redditor [bold red]{redditor_id}[/] not in DB. Adding to DB-{self.redditor_db_config}"
            )

            row = {"redditor_id": redditor_id}
            if "name" in columns:
                row["name"] = redditor.name
            if "created_at" in columns:
                row["created_at"] = datetime.datetime.fromtimestamp(redditor.created_utc).isoformat()
            if "karma" in columns:
                row["karma"] = {
                    "comment": redditor.comment_karma,
                    "link": redditor.link_karma,
                    "awardee": redditor.awardee_karma,
                    "awarder": redditor.awarder_karma,
                    "total": redditor.total_karma,
                }
            if "is_gold" in columns:
                row["is_gold"] = redditor.is_gold
            if "is_mod" in columns:
                row["is_mod"] = self._moderated_subreddits(redditor)
            if "trophy" in columns:
                row["trophy"] = self._trophies(redditor)
            if "removed" in columns:
                row["removed"] = "active"

            self.redditor_db.insert(row).execute()
            return redditor_id, True

        if hasattr(redditor, "name") and getattr(redditor, "is_suspended", False):  # Suspended account
            # Reddit exposes no id for suspended accounts, only the username. Unless the
            # `name` column was requested, the username is not collected, so the account
            # is recorded as "suspended" and no user row is stored.
            if not store_name:
                return "suspended", False

            name = redditor.name
            redditor_id = f"suspended:{name}"
            if not insert:
                return redditor_id, False

            # Check if user was previously active
            existing = (
                self.redditor_db.select("redditor_id")
                .eq("name", name)
                .execute()
                .data
            )
            if len(existing) == 1:  # Was active in the past, but suspended since
                redditor_id = existing[0].get("redditor_id", redditor_id)
                console.log(
                    f"Redditor [bold red]{redditor_id}[/] already in DB-{self.redditor_db_config}. Updating removed status"
                )
                if "removed" in columns:
                    self.redditor_db.update({"removed": "suspended"}).eq("name", name).execute()
                return redditor_id, False

            console.log(
                f"Redditor [bold red]{redditor_id}[/] not in DB-{self.redditor_db_config}. Adding to DB with limited data"
            )
            row = {"redditor_id": redditor_id, "name": name}
            if "created_at" in columns:
                row["created_at"] = None
            if "karma" in columns:
                row["karma"] = {
                    "awardee": redditor.awardee_karma,
                    "awarder": redditor.awarder_karma,
                    "total": redditor.total_karma,
                }
            if "is_gold" in columns:
                row["is_gold"] = None
            if "is_mod" in columns:
                row["is_mod"] = None
            if "trophy" in columns:
                row["trophy"] = None
            if "removed" in columns:
                row["removed"] = "suspended"

            self.redditor_db.insert(row).execute()
            return redditor_id, True

        return "deleted", False

    @staticmethod
    def _attachment(submission) -> Optional[Dict[str, str]]:
        """Media or link attached to the submission, or None for plain text posts."""
        if submission.is_reddit_media_domain:
            if submission.is_video:
                return {"video": submission.url}
            if ".jpg" in submission.url:
                return {"jpg": submission.url}
            if ".png" in submission.url:
                return {"png": submission.url}
            if ".gif" in submission.url:
                return {"gif": submission.url}
            return None
        if not submission.is_self:
            return {"url": submission.url}
        return None

    @staticmethod
    def _poll(submission) -> Optional[Dict[str, Any]]:
        """Poll attached to the submission, or None if there is no poll."""
        if not hasattr(submission, "poll_data"):
            return None

        vote_ends_at = datetime.datetime.fromtimestamp(
            submission.poll_data.voting_end_timestamp / 1000
        )
        options = submission.poll_data.options
        option_votes = {str(option): "unavailable" for option in options}

        poll = {
            "total_vote_count": submission.poll_data.total_vote_count,
            "vote_ends_at": vote_ends_at.isoformat(timespec="seconds"),
            "options": option_votes,
            "closed": vote_ends_at <= datetime.datetime.utcnow(),
        }

        if poll["closed"]:
            for option in options:
                option_votes[str(option)] = str(option.vote_count)

        return poll

    @staticmethod
    def _awards(submission) -> Dict[str, Any]:
        """Awards received by the submission."""
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

        return awards

    def submission_data(
        self,
        submission: praw.models.reddit.submission.Submission,
        mask_pii: bool,
        insert_redditor: bool = True,
    ) -> Tuple[str, int, int]:
        """
        Collects and stores a submission and, if configured, its author.

        Only the columns configured in columns['submission'] are fetched and stored.

        Args:
            submission (praw.models.reddit.submission.Submission): The praw Submission object representing the submission.
            mask_pii (bool): Whether to mask PII in submission text.
            insert_redditor (bool): Whether to insert redditor data (only if user columns are configured).

        Returns:
            Tuple[str, int, int]: A tuple containing the submission id, the count of inserted submissions and the count of inserted Redditors.
        """
        columns = self._require("submission")
        submission_id = submission.id

        if self._check_submission_exists(submission_id):
            console.log(
                f"Submission [bold red]{submission_id}[/] already in DB-{self.submission_db_config}"
            )
            return submission_id, False, False

        console.log(
            f"Submission [bold red]{submission_id}[/] not in DB. Adding to DB-{self.submission_db_config}"
        )

        row = {"submission_id": submission_id}
        redditor_inserted = False

        # The author is only looked up when it is needed: either to store the
        # redditor_id on the submission, or to insert the user row itself.
        if "redditor_id" in columns or (insert_redditor and self.user_columns is not None):
            redditor_id, redditor_inserted = self.redditor_data(submission, insert=insert_redditor)
            if "redditor_id" in columns:
                row["redditor_id"] = redditor_id

        if "created_at" in columns:
            row["created_at"] = datetime.datetime.fromtimestamp(submission.created_utc).isoformat()
        if "title" in columns:
            row["title"] = submission.title
        if "text" in columns:
            selftext = submission.selftext
            if mask_pii and selftext:
                selftext = self._mask_text_pii(selftext)
            row["text"] = selftext
        if "subreddit" in columns:
            row["subreddit"] = submission.subreddit.display_name
        if "permalink" in columns:
            row["permalink"] = f"https://www.reddit.com{submission.permalink}"
        if "attachment" in columns:
            row["attachment"] = self._attachment(submission)
        if "poll" in columns:
            row["poll"] = self._poll(submission)
        if "flair" in columns:
            row["flair"] = {
                "link": submission.link_flair_text,
                "author": submission.author_flair_text,
            }
        if "awards" in columns:
            row["awards"] = self._awards(submission)

        accessed_at = _timestamp()
        if "score" in columns:
            row["score"] = {accessed_at: submission.score}
        if "upvote_ratio" in columns:
            row["upvote_ratio"] = {accessed_at: submission.upvote_ratio}
        if "num_comments" in columns:
            row["num_comments"] = {accessed_at: submission.num_comments}

        if "edited" in columns:
            row["edited"] = submission.edited is not False
        if "archived" in columns:
            row["archived"] = submission.archived
        if "removed" in columns:
            row["removed"] = submission.removed_by_category is not None

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

        Only the columns configured in columns['comment'] are fetched and stored.

        Args:
            comments (List[praw.models.reddit.comment.Comment]): A list of praw Comment objects to collect and store.
            mask_pii (bool): Whether to mask PII in comment text.
            insert_redditor (bool): Whether to insert redditor data (only if user columns are configured).

        Returns:
            Tuple[int, int]: A tuple containing the count of inserted comments and the count of inserted Redditors.
        """
        columns = self._require("comment")
        comment_inserted_count = 0
        redditor_inserted_count = 0

        for comment in comments:
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

                row = {"comment_id": comment_id}

                if "link_id" in columns:
                    row["link_id"] = comment.link_id.replace("t3_", "")
                if "subreddit" in columns:
                    row["subreddit"] = str(comment.subreddit)
                if "parent_id" in columns:
                    row["parent_id"] = comment.parent_id

                if "redditor_id" in columns or (insert_redditor and self.user_columns is not None):
                    redditor_id, redditor_inserted = self.redditor_data(
                        comment, insert=insert_redditor
                    )
                    if redditor_inserted:
                        redditor_inserted_count += 1
                    if "redditor_id" in columns:
                        row["redditor_id"] = redditor_id

                if "created_at" in columns:
                    row["created_at"] = datetime.datetime.fromtimestamp(comment.created_utc).isoformat()

                if "body" in columns or "removed" in columns:
                    body = comment.body
                    removed = None
                    if body == "[deleted]":
                        body = None
                        removed = "deleted"
                    elif body == "[removed]":
                        body = None
                        removed = "removed"
                    elif mask_pii and body and "body" in columns:
                        body = self._mask_text_pii(body)
                    if "body" in columns:
                        row["body"] = body
                    if "removed" in columns:
                        row["removed"] = removed

                if "score" in columns:
                    row["score"] = {_timestamp(): comment.score}
                if "edited" in columns:
                    row["edited"] = comment.edited is not False

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
        Lazy collection. Collects and stores submissions (and associated users, if user columns are configured) in specified subreddits.

        Args:
            subreddits (List[str]): A list of subreddit names to collect submissions from.
            sort_types (List[str]): A list of sorting types for submissions (e.g., 'hot', 'new', 'rising', 'top', 'controversial').
            limit (int, optional): The maximum number of submissions to collect for each subreddit. Defaults to 10. Set to None to fetch maximum number of submissions.
            mask_pii (bool, optional): Mask (or anonymise) personally identifiable information (PII). Defaults to False.

        Returns:
            None. Prints the count of collected submissions and user data to the console.
        """
        self._require("submission")

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
                            console.log(f"t3_{submission.id}: [bold red]{error}[/]")
                            console.print_exception()
                            console.save_html(
                                os.path.join(self.error_log_path, f"t3_{submission.id}.html")
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
        Lazy collection. Collects and stores comments (and associated users, if user columns are configured) in specified subreddits.

        Args:
            subreddits (List[str]): A list of subreddit names to collect comments from.
            sort_types (List[str]): A list of sorting types for submissions (e.g., 'hot', 'new', 'rising', 'top', 'controversial').
            limit (int, optional): The maximum number of submissions to collect comments from (for each subreddit). Defaults to 10. Set to None to fetch maximum number of submissions.
            level (int, optional): The depth to which comment replies should be fetched. Defaults to 1. Set to None to fetch all comment replies.
            mask_pii (bool, optional): Mask (or anonymise) personally identifiable information (PII). Defaults to False.

        Returns:
            None. Prints the count of collected comments and user data to the console.
        """
        self._require("comment")

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
        Lazy collection. Collects and stores submissions, comments (and associated users, if user columns are configured) in specified subreddits.

        Args:
            subreddits (List[str]): A list of subreddit names to collect comments from.
            sort_types (List[str]): A list of sorting types for submissions (e.g., 'hot', 'new', 'rising', 'top', 'controversial').
            limit (int, optional): The maximum number of submissions to collect comments from (for each subreddit). Defaults to 10. Set to None to fetch maximum number of submissions.
            level (int, optional): The depth to which comment replies should be fetched. Defaults to 1. Set to None to fetch all comment replies.
            mask_pii (bool, optional): Mask (or anonymise) personally identifiable information (PII). Defaults to False.

        Returns:
            None. Prints the count of collected submissions, comments and user data to the console.
        """
        self._require("submission")
        self._require("comment")

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
        self._require("submission")

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
                                console.log(f"t3_{submission.id}: [bold red]{error}[/]")
                                console.print_exception()
                                console.save_html(
                                    os.path.join(self.error_log_path, f"t3_{submission.id}.html")
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
        self._require("comment")

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
        self._require("submission")

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
                        console.log(f"t3_{submission.id}: [bold red]{error}[/]")
                        console.print_exception()
                        console.save_html(
                            os.path.join(self.error_log_path, f"t3_{submission.id}.html")
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
        self._require("comment")

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

    Only the temporal metrics you collect (`score`, `upvote_ratio`, `num_comments`) are
    updated. If `archived` is collected, archived submissions are skipped and the archived
    flag is refreshed.

    Args:
        reddit_client (praw.Reddit): Reddit client.
        supabase_client (supabase.Client): Supabase client.
        db_config (dict): Database table names, e.g. {"submission": "test_submission"}.
        columns (dict): The same column configuration used for collection.
    """

    UPDATABLE_METRICS = ("score", "upvote_ratio", "num_comments")

    def __init__(
        self,
        reddit_client: praw.Reddit,
        supabase_client: supabase.Client,
        db_config: dict = None,
        columns: dict = None,
    ) -> None:
        if db_config is None:
            raise ValueError("Invalid input: db_config must be provided.")

        self.reddit = reddit_client
        self.supabase = supabase_client

        self.columns = schema.validate_columns(columns)
        submission_columns = self.columns["submission"]
        if submission_columns is None:
            raise ValueError(
                "Invalid input: columns['submission'] must be configured to update submissions."
            )

        self.metrics = [c for c in self.UPDATABLE_METRICS if c in submission_columns]
        if not self.metrics:
            raise ValueError(
                "Invalid input: updating submissions requires at least one of "
                f"{list(self.UPDATABLE_METRICS)} in columns['submission']."
            )
        self.track_archived = "archived" in submission_columns
        self.order_column = "created_at" if "created_at" in submission_columns else "submission_id"

        self.redditor_db_config = db_config.get("user")
        self.submission_db_config = db_config.get("submission")
        self.comment_db_config = db_config.get("comment")
        if not self.submission_db_config:
            raise ValueError("Invalid input: db_config must include a table name for 'submission'.")

        self.redditor_db = self.supabase.table(self.redditor_db_config) if self.redditor_db_config else None
        self.submission_db = self.supabase.table(self.submission_db_config)
        self.comment_db = self.supabase.table(self.comment_db_config) if self.comment_db_config else None

        # Get Row Counts for data to update (non-archived, if archived status is collected)
        self.submission_row_count = self._active_submissions(
            self.submission_db.select("submission_id", count="exact")
        ).execute().count

        # Event to signal the threads to stop
        self.stop_event = Event()

        check_for_updates()

    def _active_submissions(self, query):
        """Restrict a submission query to non-archived rows when the archived flag is collected."""
        if self.track_archived:
            return query.eq("archived", False)
        return query

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

            columns = ["submission_id", *self.metrics]
            paginated_submission = (
                self._active_submissions(self.submission_db.select(*columns))
                .order(self.order_column, desc=True)
                .range(start_row, end_row)
                .execute()
                .data
            )

            for submission in track(
                paginated_submission,
                description=f"Updating submission in DB-{self.submission_db_config} {page}/{page_numbers}",
            ):
                submission_id = submission["submission_id"]
                accessed_at = _timestamp()
                reddit_submission = self.reddit.submission(id=submission_id)

                payload = {}
                for metric in self.metrics:
                    history = submission[metric] or {}
                    history[accessed_at] = getattr(reddit_submission, metric)
                    payload[metric] = history

                if self.track_archived:
                    payload["archived"] = reddit_submission.archived
                    if reddit_submission.archived:
                        console.print(f"{submission_id} is archived")

                self.submission_db.update(payload).eq("submission_id", submission_id).execute()

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
