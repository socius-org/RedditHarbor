import os
import logging.config
from typing import List, Tuple
import datetime
import praw
import supabase
from rich.console import Console
from rich.traceback import install
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

console = Console(record=True)
install()

logging.config.dictConfig({
    "version": 1, 
    "disable_existing_loggers": True
})

pii_analyzer = AnalyzerEngine()
pii_anonymizer = AnonymizerEngine()

class collect:
    def __init__(
        self, reddit_client: praw.Reddit, supabase_client: supabase.Client, db_config: dict = None
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
        if db_config is not None:
            self.reddit = reddit_client
            self.supabase = supabase_client

            self.redditor_db_config = db_config["user"]
            self.submission_db_config = db_config["submission"]
            self.comment_db_config = db_config["comment"]

            self.redditor_db = self.supabase.table(self.redditor_db_config)
            self.submission_db = self.supabase.table(self.submission_db_config)
            self.comment_db = self.supabase.table(self.comment_db_config)

        else:
            raise ValueError("Invalid input: db_config must be provided.")
        
        #Check and create "error_log" folder 
        self.error_log_path = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../error_log")
        )
        if not os.path.exists(self.error_log_path):
            os.makedirs(self.error_log_path)
    
    def redditor_data(self, praw_models: praw.models) -> Tuple[str, bool]:
        """
        Collects and stores data related to a specific Redditor.

        Args:
            praw_models (praw.models): An object containing praw models.

        Returns:
            Tuple[str, bool]: A tuple containing the unique identifier of the Redditor collected and a boolean indicating whether the Redditor was inserted in the database.
        """
        redditor_inserted = False
        redditor = praw_models.author

        if hasattr(redditor, "id"):
            redditor_id = redditor.id
            """IF redditor_id in REDDITOR_DB, pass. ELSE, UPDATE REDDITOR_DB with new redditor"""
            id_filter = (
                self.redditor_db.select("redditor_id")
                .eq("redditor_id", redditor_id)
                .execute()
                .dict()["data"]
            )
            if len(id_filter) == 1:
                console.log(
                    "Redditor [bold red]{}[/] already in DB-{}".format(
                        redditor_id, self.redditor_db_config
                    )
                )
                return redditor_id, redditor_inserted
            else:
                console.log(
                    "Redditor [bold red]{}[/] not in DB. Adding to DB-{}".format(
                        redditor_id, self.redditor_db_config
                    )
                )
                name = redditor.name
                created_at = datetime.datetime.fromtimestamp(
                    redditor.created_utc
                ).isoformat()
                karma = {
                    "comment": redditor.comment_karma,
                    "link": redditor.link_karma,
                    "awardee": redditor.awardee_karma,
                    "awarder": redditor.awarder_karma,
                    "total": redditor.total_karma,
                }
                is_gold = redditor.is_gold

                if redditor.is_mod is True:
                    is_moderator, num_moderation = {}, len(redditor.moderated())
                    for m in range(num_moderation):
                        is_moderator.update(
                            {
                                redditor.moderated()[m].name: [
                                    redditor.moderated()[m].display_name,
                                    redditor.moderated()[m].subscribers,
                                ]
                            }
                        )
                elif redditor.is_mod is False:
                    is_moderator = None

                num_trophies = len(redditor.trophies())
                if num_trophies != 0:
                    trophy = []
                    for t in range(num_trophies):
                        trophy.append(redditor.trophies()[t].name)
                    trophy = {"list": trophy}
                elif num_trophies == 0:
                    trophy = None
                removed = "active"

        else:  # Suspended or Deleted
            if hasattr(redditor, "name") and redditor.is_suspended is True:
                name = redditor.name
                """IF redditor_name in REDDITOR_DB, UPDATE removed as 'suspended' from exisiting row. 
                ELSE, INSERT new row"""
                name_filter = (
                    self.redditor_db.select("name")
                    .eq("name", name)
                    .execute()
                    .dict()["data"]
                )
                if len(name_filter) == 1:  # Was Active in the Past, but Suspended
                    redditor_id = (
                        self.redditor_db.select("redditor_id")
                        .eq("name", name)
                        .execute()
                        .dict()["data"][0]["redditor_id"]
                    )
                    console.log(
                        "Redditor [bold red]{}[/] already in DB-{}. Updating removed status".format(
                            redditor_id, self.redditor_db_config
                        )
                    )
                    self.redditor_db.update({"removed": "suspended"}).eq(
                        "name", name
                    ).execute()
                    return redditor_id, redditor_inserted
                else:  # Suspended
                    redditor_id = "suspended" + ":" + name
                    console.log(
                        "Redditor [bold red]{}[/] not in DB-{}. Adding to DB with limited data".format(
                            redditor_id, self.redditor_db_config
                        )
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
                redditor_id = "deleted"
                return redditor_id, redditor_inserted

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
        redditor_inserted = True

        return redditor_id, redditor_inserted

    def submission_data(
        self, submission: praw.models.reddit.submission.Submission, mask_pii: bool
    ) -> Tuple[str, int, int]:
        """
        Collects and stores submissions and associated users in a specified subreddit.

        Args:
            submission (praw.models.reddit.submission.Submission): The praw Submission object representing the submission.

        Returns:
            Tuple[str, int, int]: A tuple containing the submission id, the count of inserted submissions and the count of inserted Redditors.
        """
        accessed_at = datetime.datetime.utcnow()
        submission_id = submission.id
        submission_inserted = False
        redditor_inserted = False

        id_filter = (
            self.submission_db.select("submission_id")
            .eq("submission_id", submission_id)
            .execute()
            .dict()["data"]
        )
        if len(id_filter) == 1:
            console.log(
                "Submission [bold red]{}[/] already in DB-{}".format(
                    submission_id, self.submission_db_config
                )
            )

        else:
            console.log(
                "Submission [bold red]{}[/] not in DB. Adding to DB-{}".format(
                    submission_id, self.submission_db_config
                )
            )

            redditor_id, redditor_inserted = self.redditor_data(submission) #consider not saving if redditor_id is "deleted"
            created_at = datetime.datetime.fromtimestamp(submission.created_utc)
            title = submission.title
            
            selftext = submission.selftext
            if mask_pii is True: 
                #presidio assumes you know what language you are sending to it. 
                #consider using a language detection mechanism, or user to set language
                pii_results = pii_analyzer.analyze(text=selftext, language="en", return_decision_process=False)
                selftext = pii_anonymizer.anonymize(text=selftext, analyzer_results=pii_results).text
            
            subreddit = submission.subreddit.display_name
            permalink = "https://www.reddit.com" + submission.permalink

            if submission.is_reddit_media_domain:
                if submission.is_video:
                    attachment = {"video": submission.url}
                else:
                    if ".jpg" in submission.url:
                        attachment = {"jpg": submission.url}
                    elif ".png" in submission.url:
                        attachment = {"png": submission.url}
                    elif ".gif" in submission.url:
                        attachment = {"gif": submission.url}
            else:
                if submission.is_self:
                    attachment = None
                else:
                    attachment = {"url": submission.url}

            if hasattr(submission, "poll_data"):
                vote_ends_at = datetime.datetime.fromtimestamp(
                    submission.poll_data.voting_end_timestamp / 1000
                )
                options = submission.poll_data.options
                Options = {}
                for option in options:
                    Options.update({f"{option}": "unavaliable"})
                poll = {
                    "total_vote_count": 0,
                    "vote_ends_at": vote_ends_at.isoformat(timespec="seconds"),
                    "options": Options,
                    "closed": bool,
                }

                if vote_ends_at > datetime.datetime.utcnow():
                    poll["total_vote_count"] = submission.poll_data.total_vote_count
                    poll["closed"] = False
                else:
                    poll["total_vote_count"] = submission.poll_data.total_vote_count
                    poll["closed"] = True
                    for option in options:
                        Options[f"{option}"] = f"{option.vote_count}"
            else:
                poll = None

            flair = {
                "link": submission.link_flair_text,
                "author": submission.author_flair_text,
            }

            if submission.total_awards_received == 0:
                awards = {
                    "total_awards_count": 0,
                    "total_awards_price": 0,
                    "list": None,
                }
            else:
                awards = {"total_awards_count": submission.total_awards_received}
                awards_list = {}
                total_awards_price = 0

                for awardings in submission.all_awardings:
                    awards_list.update(
                        {
                            awardings["name"]: [
                                awardings["count"],
                                awardings["coin_price"],
                            ]
                        }
                    )
                    total_awards_price += awardings["coin_price"] * awardings["count"]
                awards.update({"total_awards_price": total_awards_price})
                awards["list"] = awards_list

            score = {accessed_at.isoformat(timespec="seconds"): submission.score}
            upvote_ratio = {
                accessed_at.isoformat(timespec="seconds"): submission.upvote_ratio
            }
            num_comments = {
                accessed_at.isoformat(timespec="seconds"): submission.num_comments
            }

            if submission.edited is False:
                edited = False
            else:
                edited = True  # if edited, submission.edited returns when the post was edited in terms of unix

            archived = submission.archived
            # archived_at = created_at + relativedelta(months=+6)

            if submission.removed_by_category is None:
                removed = False
            else:
                removed = True  # if removed, submission.removed_by_category returns the reason why the post was removed

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
            submission_inserted = True

        return submission_id, submission_inserted, redditor_inserted

    def comment_data(
        self, comments: List[praw.models.reddit.comment.Comment], mask_pii: bool
    ) -> Tuple[int, int]:
        """
        Collects and stores comment data associated with a list of comments.

        Args:
            comments (List[praw.models.reddit.comment.Comment]): A list of praw Comment objects to collect and store.

        Returns:
            Tuple[int, int]: A tuple containing the count of inserted comments and the count of inserted Redditors.
        """
        comment_inserted_count = 0
        redditor_inserted_count = 0

        for comment in comments:
            accessed_at = datetime.datetime.utcnow()
            try:
                comment_id = comment.id
                id_filter = (
                    self.comment_db.select("comment_id")
                    .eq("comment_id", comment_id)
                    .execute()
                    .dict()["data"]
                )
                if len(id_filter) == 1:
                    console.log(
                        "Comment [bold red]{}[/] already in DB-{}".format(
                            comment_id, self.comment_db_config
                        )
                    )
                else:
                    # If exists, PASS. Else, INSERT
                    console.log(
                        "Adding comment [bold red]{}[/] to DB-{}".format(
                            comment_id, self.comment_db_config,
                        )
                    )
                    link_id = comment.link_id.replace("t3_", "")
                    subreddit = str(comment.subreddit)
                    parent_id = comment.parent_id
                    redditor_id, redditor_inserted = self.redditor_data(comment) #consider not saving if redditor_id is "deleted"
                    if redditor_inserted is True:
                        redditor_inserted_count += 1

                    created_at = datetime.datetime.fromtimestamp(comment.created_utc)

                    selfbody = comment.body
                    if mask_pii is True: 
                        pii_results = pii_analyzer.analyze(text=selfbody, language="en", return_decision_process=False)
                        selfbody = pii_anonymizer.anonymize(text=selfbody, analyzer_results=pii_results).text
                    removed = None

                    if comment.edited is False:
                        edited = False
                    else:
                        edited = True

                    if selfbody == "[deleted]":
                        selfbody = None
                        removed = "deleted"
                    elif selfbody == "[removed]":
                        selfbody = None
                        removed = "removed"

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
                console.save_html(os.path.join(self.error_log_path, f"t1_{comment.id}.html"))
                continue

        return comment_inserted_count, redditor_inserted_count

    def subreddit_submission(
        self, subreddits: List[str], sort_types: List[str], limit: int = 10, mask_pii: bool = False
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
                for sort_type in sort_types:
                    console.print(sort_type, justify="center")
                    r_ = self.reddit.subreddit(subreddit)
                    for submission in getattr(r_, sort_type)(limit=limit):
                        try:
                            (
                                submission_id,
                                submission_inserted,
                                redditor_inserted,
                            ) = self.submission_data(submission=submission, mask_pii=mask_pii)

                            if submission_inserted is True:
                                total_submission_inserted_count += 1
                            if redditor_inserted is True:
                                total_redditor_inserted_count += 1

                        except Exception as error:
                            console.log(f"t3_{submission_id}: [bold red]{error}[/]")
                            console.print_exception()
                            console.save_html(
                                os.path.join(self.error_log_path, f"t3_{submission_id}.html")
                            )
                            continue

        return console.print(
            f"[bold green]{total_submission_inserted_count} submission and {total_redditor_inserted_count} user data collected from subreddit(s) {subreddits}"
        )

    def subreddit_comment(
        self,
        subreddits: List[str],
        sort_types: List[str],
        limit: int = 10,
        level: int = 1,
        mask_pii: bool = False 
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
                for sort_type in sort_types:
                    console.print(sort_type, justify="center")

                    r_ = self.reddit.subreddit(subreddit)

                    for submission in getattr(r_, sort_type)(limit=limit):
                        try:
                            submission_id = submission.id
                            
                            link_id_filter = (
                                self.comment_db.select("link_id")
                                .eq("link_id", submission_id)
                                .execute()
                                .dict()["data"]
                            )

                            if len(link_id_filter) >= 1:
                                console.log(
                                    "Submission Link [bold red]{}[/] already in DB-{}".format(
                                        submission_id, self.comment_db_config
                                    )
                                )

                            else:
                                submission.comments.replace_more(limit=level)
                                # len(submission.comments.list()) would often give different values to submission.num_comments
                                comments = submission.comments.list()
                                (
                                    comment_inserted_count,
                                    redditor_inserted_count,
                                ) = self.comment_data(comments=comments, mask_pii=mask_pii)
                                total_comment_inserted_count += comment_inserted_count
                                total_redditor_inserted_count += redditor_inserted_count

                        except Exception as error:
                            console.log(f"t3_{submission.id}: [bold red]{error}[/]")
                            console.print_exception()
                            console.save_html(
                                os.path.join(self.error_log_path, f"t3_{submission.id}.html")
                            )
                            continue

        return console.print(
            f"[bold green]{total_comment_inserted_count} comment and {total_redditor_inserted_count} user data collected from subreddit(s) {subreddits}"
        )

    def subreddit_submission_and_comment(
        self,
        subreddits: List[str],
        sort_types: List[str],
        limit: int = 10,
        level: int = 1,
        mask_pii: bool = False 
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
                for sort_type in sort_types:
                    console.print(sort_type, justify="center")
                    r_ = self.reddit.subreddit(subreddit)
                    for submission in getattr(r_, sort_type)(limit=limit):
                        try:
                            #Collect Submission
                            (
                                submission_id,
                                submission_inserted,
                                submission_redditor_inserted,
                            ) = self.submission_data(submission=submission, mask_pii=mask_pii)
                            
                            if submission_inserted is True: 
                                total_submission_inserted_count += 1 
                            if submission_redditor_inserted is True: 
                                total_redditor_inserted_count += 1 
                            
                            #Check if comments of submission were crawled
                            link_id_filter = (
                                self.comment_db.select("link_id")
                                .eq("link_id", submission_id)
                                .execute()
                                .dict()["data"]
                            )
                            
                            if len(link_id_filter) >= 1:
                                console.log(
                                    "Submission Link [bold red]{}[/] already in DB-{}".format(
                                        submission_id, self.comment_db_config
                                    )
                                )

                            else:
                                submission.comments.replace_more(limit=level)
                                # len(submission.comments.list()) would often give different values to submission.num_comments
                                comments = submission.comments.list()
                                (
                                    comment_inserted_count,
                                    comment_redditor_inserted_count,
                                ) = self.comment_data(comments=comments, mask_pii=mask_pii)
                                total_comment_inserted_count += comment_inserted_count
                                total_redditor_inserted_count += comment_redditor_inserted_count

                        except Exception as error:
                            console.log(f"t3_{submission.id}: [bold red]{error}[/]")
                            console.print_exception()
                            console.save_html(
                                os.path.join(self.error_log_path, f"t3_{submission.id}.html")
                            )
                            continue

        return console.print(
            f"[bold green]{total_submission_inserted_count} submission, {total_comment_inserted_count} comment, and {total_redditor_inserted_count} user data collected from subreddit(s) {subreddits}"
        )

    def submission_from_user(
        self, user_names: List[str], sort_types: List[str], limit: int = 10, mask_pii: bool = False
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
                        submissions = [
                            submission
                            for submission in getattr(redditor.submissions, sort_type)(
                                limit=limit
                            )
                        ]
                        for submission in submissions:
                            try:
                                (
                                    submission_id,
                                    submission_inserted,
                                ) = self.submission_data(submission=submission, mask_pii=mask_pii)[:2]
                                if submission_inserted is True:
                                    total_submission_inserted_count += (
                                        submission_inserted
                                    )
                            except Exception as error:
                                console.log(f"t3_{submission_id}: [bold red]{error}[/]")
                                console.print_exception()
                                console.save_html(
                                    os.path.join(
                                        self.error_log_path, f"t3_{submission_id}.html"
                                    )
                                )
                                continue

                    except Exception as error:
                        console.log(f"user_{user_name}: [bold red]{error}[/]")
                        console.print_exception()
                        console.save_html(
                            os.path.join(self.error_log_path, f"user_{user_name}.html")
                        )
                        continue
        return console.print(
            f"[bold green]{total_submission_inserted_count} submission data collected from user(s) {user_names}"
        )

    def comment_from_user(
        self, user_names: List[str], sort_types: List[str], limit: int = 10, mask_pii: bool = True 
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
                        comments = [
                            comment
                            for comment in getattr(redditor.comments, sort_type)(
                                limit=limit
                            )
                        ]
                        comment_inserted_count = self.comment_data(comments=comments, mask_pii=mask_pii)[0]
                        total_comment_inserted_count += comment_inserted_count
                    except Exception as error:
                        console.log(f"user_{user_name}: [bold red]{error}[/]")
                        console.print_exception()
                        console.save_html(
                            os.path.join(self.error_log_path, f"user_{user_name}.html")
                        )
                        continue

        return console.print(
            f"[bold green]{total_comment_inserted_count} comment data collected from user(s) {user_names}"
        )
    
    # def submission_from_subreddit(self):
    #     return 
    
    # def comment_from_subreddit(self):
    #     return 
    
    # def user_from_submission(self):
    #     return
    
    # def user_from_subreddit(self): 
    #     return 