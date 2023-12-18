import supabase
from typing import List
from rich.progress import track
from rich.console import Console

console = Console()

# class submission: 
#     def __init__(): 
#         return

# class comment: 
#     def __init__():
#         return 
    
class user: 
    """
    A class for interacting with a Supabase table containing user data.

    Args:
        supabase_client (supabase.Client): The Supabase client used for database interaction.
        db_name (str): The name of the Supabase table containing user data.
    """
    def __init__(
        self,
        supabase_client: supabase.Client,
        db_name: str
    ):
        """
        Initialize an instance for interacting with a Supabase table containing user data.

        Args:
            supabase_client (supabase.Client): The Supabase client used for database interaction.
            db_name (str): The name of the Supabase table containing user data.
        """
        self.supabase = supabase_client
        self.redditor_db_config = db_name
        self.redditor_db = self.supabase.table(self.redditor_db_config)
        
    def name(self, limit: int = None) -> List[str]: 
        """
        Fetch user names from the Supabase table.

        Args:
            limit (int, optional): The maximum number of rows to fetch. If None, fetch all rows.
                Defaults to None.

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
        
        start_row, end_row = 0, min(limit, page_size) 

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