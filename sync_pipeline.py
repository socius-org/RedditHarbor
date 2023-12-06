import praw 
import supabase 
from rich.console import Console
console = Console(record=True)
from rich.traceback import install
install()
import datetime
# from datetime import timezone
# from dateutil.relativedelta import relativedelta

class collect:
    def __init__(
        self,
        reddit: praw.Reddit,
        supabase: supabase.Client,
        db_config: dict = {"redditor": None, "submission": None, "comment": None},
    ):
        """
        Initializes the Collect class with instances of praw.Reddit, supabase.Client, and database configurations.

        Args:
            reddit (praw.Reddit): An instance of the Reddit API client.
            supabase (Client): An instance of the Supabase client.
            db_config (dict): A dictionary containing database configurations.  
        """

        self.reddit = reddit
        self.supabase = supabase 
        self.redditor_db_config = db_config["redditor"]
        self.submission_db_config = db_config["submission"]
        self.comment_db_config = db_config["comment"]

    def redditor_data(self, praw_models: praw.models) -> str:
        """
        Collects and stores data related to a specific Redditor.

        Args:
            praw_models (praw.models): An object containing praw models.

        Returns:
            str: The unique identifier of the Redditor collected.
        """

        self.redditor_db = self.supabase.table(self.redditor_db_config)
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
                return redditor_id
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
                    return redditor_id
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
                return redditor_id

        row = {
            "redditor_id": redditor_id,
            "name": name,
            "created_at": created_at,
            "karma": karma,
            "is_gold": is_gold,
            "is_mod": is_moderator,
            "trophy": trophy,
            "removed": removed
        }

        # prinTable = Table()
        # prinTable.add_column("redditor_id")
        # prinTable.add_column("name")
        # prinTable.add_column("created_at")
        # prinTable.add_column("karma")
        # prinTable.add_column("is_gold")
        # prinTable.add_column("is_mod")
        # prinTable.add_column("trophy")
        # prinTable.add_column("removed")
        # prinTable.add_row(
        #     redditor_id, name, created_at, str(karma), str(is_gold), str(is_moderator), str(trophy), removed
        # )
        # console.print(prinTable)

        self.redditor_db.insert(row).execute()

        return redditor_id

    def submission_data(
        self,
        subreddit: str,
        sort_type: str,
        limit: int = 10
    ):
        """
        Collects and stores data related to submissions in specified subreddits.

        Args:
            subreddits (str): A subreddit name to collect submissions from.
            sort_type (str): The sorting type for submissions (e.g., 'hot', 'new', 'rising', 'top', 'controversial').
            limit (int, optional): The maximum number of submissions to collect. Defaults to 10.

        Returns:
            TBD (could potentially return list - or simply a number - of collected submission_ids)
        """
        r_ = self.reddit.subreddit(subreddit)
        self.submission_db = self.supabase.table(self.submission_db_config)

        for submission in getattr(r_, sort_type)(limit=limit):
            accessed_at = datetime.datetime.utcnow()
            try:
                submission_id = submission.id

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

                    redditor_id = self.redditor_data(submission)
                    created_at = datetime.datetime.fromtimestamp(submission.created_utc)
                    title = submission.title
                    selftext = submission.selftext
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
                            poll[
                                "total_vote_count"
                            ] = submission.poll_data.total_vote_count
                            poll["closed"] = False
                        else:
                            poll[
                                "total_vote_count"
                            ] = submission.poll_data.total_vote_count
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
                        awards = {
                            "total_awards_count": submission.total_awards_received
                        }
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
                            total_awards_price += (
                                awardings["coin_price"] * awardings["count"]
                            )
                        awards.update({"total_awards_price": total_awards_price})
                        awards["list"] = awards_list

                    score = {
                        accessed_at.isoformat(timespec="seconds"): submission.score
                    }
                    upvote_ratio = {
                        accessed_at.isoformat(
                            timespec="seconds"
                        ): submission.upvote_ratio
                    }
                    num_comments = {
                        accessed_at.isoformat(
                            timespec="seconds"
                        ): submission.num_comments
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

            except Exception as error:
                console.log("t3_{}: [bold red]{}[/]".format(submission.id, error))
                console.print_exception()
                console.save_html("error_log/t3_{}.html".format(submission.id))
                continue

    def comment_data(self, limit: int = None):
        """
        Collects and stores comments and associated redditors based on submissions in the Supabase database.

        Args:
            limit (int, optional): The maximum number of comments to collect. Defaults to None.

        Returns:
            TBD (could potentially return list - or simply a number - of collected comment_ids)
        """
        self.comment_db = self.supabase.table(self.comment_db_config)
        self.submission_db = self.supabase.table(self.submission_db_config)
        submission_ids = self.submission_db.select(
            "submission_id", count="exact"
        ).execute()
        row_count = submission_ids.count

        page_size = 1000
        page_numbers = (row_count // page_size) + 2
        start_row = 1
        end_row = 1000

        for page in range(1, page_numbers):
            if page == 1:
                pass
            elif page < (page_numbers - 1):
                start_row += 1000
                end_row += 1000
            else:
                start_row += 1000
                end_row = row_count
            paginated_submissions = (
                self.submission_db.select("submission_id")
                .range(start_row, end_row)
                .execute()
            )
            
            for submission in paginated_submissions.dict()["data"]:
                submission_id = submission["submission_id"]
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
                    continue

                try:
                    submission = self.reddit.submission(id=submission_id)
                    submission.comments.replace_more(limit=limit)
                    # len(submission.comments.list()) would often give different values to submission.num_comments
                    for comment in submission.comments.list():
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
                                    "Adding comment [bold red]{}[/] of submission [bold red]{}[/] to DB-{}".format(
                                        comment_id, submission_id, self.comment_db_config
                                    )
                                )
                                link_id = comment.link_id.replace("t3_", "")
                                parent_id = comment.parent_id
                                redditor_id = self.redditor_data(comment)
                                created_at = datetime.datetime.fromtimestamp(
                                    comment.created_utc
                                )

                                selfbody = comment.body
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

                                score = {
                                    accessed_at.isoformat(
                                        timespec="seconds"
                                    ): comment.score
                                }

                                row = {
                                    "comment_id": comment_id,
                                    "link_id": link_id,
                                    "parent_id": parent_id,
                                    "redditor_id": redditor_id,
                                    "created_at": created_at.isoformat(),
                                    "body": selfbody,
                                    "score": score,
                                    "edited": edited,
                                    "removed": removed,
                                }

                                self.comment_db.insert(row).execute()

                        except Exception as error:
                            console.log(
                                "t1_{}: [bold red]{}[/]".format(comment.id, error)
                            )
                            console.print_exception()
                            console.save_html("error_log/t1_{}.html".format(comment.id))
                            continue

                except Exception as error:
                    console.log("t3_{}: [bold red]{}[/]".format(submission.id, error))
                    console.print_exception()
                    console.save_html("error_log/t3_{}.html".format(submission.id))
                    continue
