import supabase
from typing import List
from rich.progress import track
from rich.console import Console

console = Console()
    
class user: 
    """
    A class to interact with redditors(users) stored in a Supabase database.

    Attributes:
        supabase (supabase.Client): The Supabase client used to access the database.
        redditor_db_config (str): The name of the database table storing redditor data.
        redditor_db (supabase.Table): The Supabase table object representing the redditor database.
    """
    def __init__(
        self,
        supabase_client: supabase.Client,
        db_name: str
    ):
        """
        Initializes the user class with the Supabase client and database name.

        Args:
            supabase_client (supabase.Client): The Supabase client instance.
            db_name (str): The name of the database table containing user data.
        """
        self.supabase = supabase_client
        self.redditor_db_config = db_name
        self.redditor_db = self.supabase.table(self.redditor_db_config)
        
    def name(self, limit: int = None) -> List[str]: 
        """
        Fetch user names from the database.

        Args:
            limit (int, optional): The maximum number of rows to fetch. Defaults to None, retrieving all.

        Returns:
            List[str]: A list of user names.
        """
        redditor_names = list()
        
        if limit is None: 
            #Get all rows 
            row_count = (
                self.redditor_db.select("redditor_id", count="exact")
                .execute()
                .count
            ) 
            page_size = 1000
            page_numbers = (row_count // page_size) + (1 if row_count % page_size != 0 else 0)
        else: 
            #Get limited rows 
            row_count = limit 
            page_size = 1000 
            page_numbers = (row_count // page_size) + (1 if row_count % page_size != 0 else 0)
        
        start_row, end_row = 0, min(row_count, page_size) 

        for page in track(
            range(1, page_numbers + 1),
            description=f"Fetching user names from {self.redditor_db_config}",
        ):
            if page == 1:
                pass
            elif page < (page_numbers - 1):
                    start_row += page_size
                    end_row += page_size
            else:
                start_row += page_size
                end_row = row_count
            
            paginated_redditor_name = (
                self.redditor_db.select("name").range(start_row, end_row).execute()
            ).model_dump()["data"]
            redditor_name = [redditor["name"] for redditor in paginated_redditor_name]
            # Could use redditor_name += redditor_name, but in general, 'extend' method is often preferred 
            #because it modifies the list in place, while the + operator creates a new list, which might be 
            #less memory-efficient for large lists.
            redditor_names.extend(redditor_name)
        
        return redditor_names

class submission: 
    """
    A class to interact with submissions stored in a Supabase database.

    Attributes:
        supabase (supabase.Client): The Supabase client used to access the database.
        submission_db_config (str): The name of the database table storing submission data.
        submission_db (supabase.Table): The Supabase table object representing the submission database.
    """
    def __init__(
        self,
        supabase_client: supabase.Client, 
        db_name: str
    ): 
        """
        Initializes the submission class with the Supabase client and database name.

        Args:
            supabase_client (supabase.Client): The Supabase client instance.
            db_name (str): The name of the database table storing submission data.
        """
        self.supabase = supabase_client
        self.submission_db_config = db_name
        self.submission_db = self.supabase.table(self.submission_db_config)
    
    def id(self, limit: int = None) -> List[str]: 
        """
        Retrieves submission IDs from the database.

        Args:
            limit (int, optional): The maximum number of submission IDs to retrieve. Defaults to None, retrieving all.

        Returns:
            List[str]: A list of submission IDs.
        """
        submission_ids = list()
        
        if limit is None: 
            #Get all rows 
            row_count = (
                self.submission_db.select("submission_id", count="exact")
                .execute()
                .count
            ) 
            page_size = 1000
            page_numbers = (row_count // page_size) + (1 if row_count % page_size != 0 else 0)
        else: 
            #Get limited rows 
            row_count = limit 
            page_size = 1000 
            page_numbers = (row_count // page_size) + (1 if row_count % page_size != 0 else 0)
        
        start_row, end_row = 0, min(row_count, page_size) 

        for page in track(
            range(1, page_numbers + 1),
            description=f"Fetching submission ids from {self.submission_db_config}",
        ):
            if page == 1:
                pass
            elif page < (page_numbers - 1):
                    start_row += page_size
                    end_row += page_size
            else:
                start_row += page_size
                end_row = row_count
            
            paginated_submission_id = (
                self.submission_db.select("submission_id").range(start_row, end_row).execute()
            ).model_dump()["data"]
            submission_id = [data["submission_id"] for data in paginated_submission_id]
            submission_ids.extend(submission_id)
        
        return submission_ids
        

# class comment: 
#     def __init__():
#         return 