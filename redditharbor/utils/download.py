import os
import supabase
import pickle
import json
import csv
from typing import List
from rich.progress import track
from rich.console import Console
import requests 
from io import BytesIO
from PIL import Image

console = Console()

# While it might have been possible to design a unified class for submission, comment, and redditor,
# we opted for three separate classes with near-identical structures to enhance user experience (UX).

class submission:
    def __init__(
        self,
        supabase_client: supabase.Client,
        db_name: str,
        paginate: bool or dict = True,
    ):
        """
        Initialize an instance for interacting with a Supabase table containing submission data.

        Args:
            supabase_client (supabase.Client): The Supabase client used for database interaction.
            db_name (str): The name of the Supabase table containing submission data.
            paginate (bool or dict, optional): Set to `True` to automatically paginate through large datasets.
                You can also provide a dictionary with "row_count" and "page_size" values.
                Defaults to False.

        Note:
            If your database has more than 1 million rows, it's recommended to set the paginate parameter to 
            ensure efficient data retrieval. You can set paginate to True for automatic settings or provide 
            a dictionary with "row_count" and "page_size" values. 
             
            For larger datasets, consider:
                1. Set "row_count" by checking row counts directly from the Supabase table editor. 
                It is common for large datasets to raise ReadTimeoutError, when counting the entire rows. 
                
                2. Adjust the "Max Rows" setting in 'API Settings' on Supabase, allowing you to retrieve up to 10,000 rows at a time. 
                The default limit to the amount of rows returned is 1,000 in Supabase.
            
        """
        self.supabase = supabase_client
        self.submission_db_config = db_name
        self.submission_db = self.supabase.table(self.submission_db_config)
        self.paginate = paginate

        self.columns = [
            "submission_id",
            "redditor_id",
            "created_at",
            "title",
            "text",
            "subreddit",
            "permalink",
            "attachment",
            "flair",
            "awards",
            "score",
            "upvote_ratio",
            "num_comments",
            "edited",
            "archived",
            "removed",
            "poll",
        ]

        if self.paginate is True:
            self.row_count = (
                self.submission_db.select("submission_id", count="exact")
                .execute()
                .count
            )
            self.page_size = 1000
            self.page_numbers = (self.row_count // self.page_size) + (1 if self.row_count % self.page_size != 0 else 0)
        else:
            # self.paginate.get("key", default) is a dictionary method that returns the value for the given key if the key is present in the dictionary. If the key is not found, it returns the default value.
            # In this case, it's used to get the "row_count" and "page_size" from the paginate dictionary, with default values of fetching the row count from Supabase and using a default page size of 1000 if these keys are not present.
            self.row_count = self.paginate.get(
                "row_count",
                self.submission_db.select("submission_id", count="exact")
                .execute()
                .count,
            )
            self.page_size = self.paginate.get("page_size", 1000)
            self.page_numbers = (self.row_count // self.page_size) + (1 if self.row_count % self.page_size != 0 else 0)

    def to_pkl(self, columns: List[str] or str, file_name: str, file_path: str = ""):
        """
        Save Supabase data to multiple .pickle files.

        Args:
            columns (Union[List[str], str]): A list of column names to select or "all" for all columns.
            file_name (str): The base name for the output files.
            file_path (str): The relative path to the directory where the .pickle files will be saved.

        Raises:
            ValueError: If the provided columns are not valid or if the input is neither a string nor a list.

        Returns:
            None. Prints the number of rows downloaded and the number of .pickle files created.
        """
        save_file_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../{file_path}")
        )
        if isinstance(columns, str):
            if columns.lower() == "all":
                columns = "*"
            else:
                raise ValueError(f"Invalid input: {columns}")
        elif isinstance(columns, list):
            invalid_columns = set(columns) - set(self.columns)
            if invalid_columns:
                raise ValueError(f"Invalid column names provided: {invalid_columns}")
        else:
            raise ValueError("Input is neither a string nor a list.")

        start_row, end_row = 0, self.page_size

        for page in track(
            range(1, self.page_numbers + 1),
            description=f"Downloading to .pickle file in {save_file_path}",
        ):
            if page == 1:
                pass
            elif page < (self.page_numbers - 1):
                    start_row += self.page_size
                    end_row += self.page_size
            else:
                start_row += self.page_size
                end_row = self.row_count
            
            paginated_submissions = (
                self.submission_db.select(*columns).range(start_row, end_row).execute()
            ).model_dump()["data"]
            with open(f"{save_file_path}/{file_name}_{page}.pickle", "wb") as handle:
                pickle.dump(
                    paginated_submissions, handle, protocol=pickle.HIGHEST_PROTOCOL
                )

        return console.print(
            f"{self.row_count} rows downloaded and saved in {self.page_numbers - 1} pickle files"
        )

    def to_csv(self, columns: List[str] or str, file_name: str, file_path: str = ""):
        """
        Save Supabase data to a .csv file.

        Args:
            columns (Union[List[str], str]): A list of column names to select or "all" for all columns.
            file_name (str): The base name for the output file.
            file_path (str): The relative path to the directory where the CSV file will be saved.

        Raises:
            ValueError: If the provided columns are not valid or if the input is neither a string nor a list.

        Returns:
            None. Prints the number of rows downloaded and the CSV file created.
        """

        save_file_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../{file_path}")
        )

        if isinstance(columns, str):
            if columns.lower() == "all":
                columns = "*"
            else:
                raise ValueError(f"Invalid input: {columns}")
        elif isinstance(columns, list):
            invalid_columns = set(columns) - set(self.columns)
            if invalid_columns:
                raise ValueError(f"Invalid column names provided: {invalid_columns}")
        else:
            raise ValueError("Input is neither a string nor a list.")

        start_row, end_row = 0, 1000

        with open(
            f"{save_file_path}/{file_name}.csv", "w", newline="", encoding="utf-8"
        ) as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(columns if columns != "*" else self.columns)

            for page in track(
                range(1, self.page_numbers + 1),
                description=f"Downloading to .csv file in {save_file_path}",
            ):
                if page == 1:
                    pass
                elif page < (self.page_numbers - 1):
                    start_row += self.page_size
                    end_row += self.page_size
                else:
                    start_row += self.page_size
                    end_row = self.row_count
                
                paginated_submissions = (
                    self.submission_db.select(*columns)
                    .range(start_row, end_row)
                    .execute()
                ).model_dump()["data"]
                for row in paginated_submissions:
                    writer.writerow(list(row.values()))

        return console.print(
            f"{self.row_count} rows downloaded and saved in {save_file_path}\{file_name}.csv"
        )

    def to_txt(self, columns: List[str] or str, file_name: str, file_path: str = ""):
        """
        Save Supabase data to a .txt file.

        Args:
            columns (Union[List[str], str]): A list of column names to select or "all" for all columns.
            file_name (str): The base name for the output file.
            file_path (str): The relative path to the directory where the TXT file will be saved.

        Raises:
            ValueError: If the provided columns are not valid or if the input is neither a string nor a list.

        Returns:
            None. Prints the number of rows downloaded and the TXT file created.
        """

        save_file_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../{file_path}")
        )

        if isinstance(columns, str):
            if columns.lower() == "all":
                columns = "*"
            else:
                raise ValueError(f"Invalid input: {columns}")
        elif isinstance(columns, list):
            invalid_columns = set(columns) - set(self.columns)
            if invalid_columns:
                raise ValueError(f"Invalid column names provided: {invalid_columns}")
        else:
            raise ValueError("Input is neither a string nor a list.")

        start_row, end_row = 0, self.page_size

        with open(
            f"{save_file_path}/{file_name}.txt", "w", encoding="utf-8"
        ) as txtfile:
            txtfile.write("\t".join(columns if columns != "*" else self.columns) + "\n")

            for page in track(
                range(1, self.page_numbers + 1),
                description=f"Downloading to .txt file in {save_file_path}",
            ):
                if page == 1:
                    pass
                elif page < (self.page_numbers - 1):
                    start_row += self.page_size
                    end_row += self.page_size
                else:
                    start_row += self.page_size
                    end_row = self.row_count
                
                paginated_submissions = (
                    self.submission_db.select(*columns)
                    .range(start_row, end_row)
                    .execute()
                ).model_dump()["data"]
                for row in paginated_submissions:
                    txtfile.write("\t".join(map(str, row.values())) + "\n")

        return console.print(
            f"{self.row_count} rows downloaded and saved in {save_file_path}\{file_name}.txt"
        )

    def to_json(self, columns: List[str] or str, file_name: str, file_path: str = ""):
        """
        Save Supabase data to multiple .json files.

        Args:
            columns (Union[List[str], str]): A list of column names to select or "all" for all columns.
            file_name (str): The base name for the output file.
            file_path (str): The relative path to the directory where the JSON file will be saved.

        Raises:
            ValueError: If the provided columns are not valid or if the input is neither a string nor a list.

        Returns:
            None. Prints the number of rows downloaded and the JSON file created.
        """
        # Similar to to_csv but saving to JSON format
        save_file_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../{file_path}")
        )

        if isinstance(columns, str):
            if columns.lower() == "all":
                columns = "*"
            else:
                raise ValueError(f"Invalid input: {columns}")
        elif isinstance(columns, list):
            invalid_columns = set(columns) - set(self.columns)
            if invalid_columns:
                raise ValueError(f"Invalid column names provided: {invalid_columns}")
        else:
            raise ValueError("Input is neither a string nor a list.")

        start_row, end_row = 0, self.page_size

        for page in track(
            range(1, self.page_numbers + 1),
            description=f"Downloading to .json file in {save_file_path}",
        ):
            if page == 1:
                pass
            elif page < (self.page_numbers - 1):
                    start_row += self.page_size
                    end_row += self.page_size
            else:
                start_row += self.page_size
                end_row = self.row_count
            
            paginated_submissions = (
                self.submission_db.select(*columns).range(start_row, end_row).execute()
            ).model_dump()["data"]
            with open(
                f"{save_file_path}/{file_name}_{page}.json", "w", encoding="utf-8"
            ) as jsonfile:
                json.dump(paginated_submissions, jsonfile, ensure_ascii=False, indent=2)

        return console.print(
            f"{self.row_count} rows downloaded and saved in {self.page_numbers - 1} json files"
        )
    
    def to_img(self, file_path: str = ""):
        """
        Save image data in submissions to .jpeg or .png files. Ignores all other columns. 

        Args:
            file_path (str): The relative path to the directory where the image file will be saved.

        Returns:
            None. Prints the number of images downloaded.
        """
        # Similar to to_csv but saving to JSON format
        save_file_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../{file_path}")
        )
        os.makedirs(save_file_path, exist_ok=True)
        
        success, fail = 0, 0 
        failed_urls = list()
        start_row, end_row = 0, self.page_size

        for page in track(
            range(1, self.page_numbers + 1),
            description=f"Downloading to image file(s) in {save_file_path}",
        ):
            if page == 1:
                pass
            elif page < (self.page_numbers - 1):
                    start_row += self.page_size
                    end_row += self.page_size
            else:
                start_row += self.page_size
                end_row = self.row_count
            
            paginated_submissions = (
                self.submission_db.select("submission_id", "attachment").range(start_row, end_row).execute()
            ).model_dump()["data"]
            for data in paginated_submissions: 
                if (data['attachment'] is None): 
                    pass 
                else:
                    if 'jpg' in data['attachment'].keys():  
                        img_url = data.get('attachment', {}).get('jpg', None)
                        img_type = 'jpg'
                    elif 'png' in data["attachment"].keys():
                        img_url = data.get('attachment', {}).get('png', None)
                        img_type = 'png'
                    else: 
                        img_url = None 
                    
                    if img_url is not None:         
                        response = requests.get(img_url)
                        if response.status_code == 200: 
                            path = os.path.join(save_file_path, f"{data['submission_id']}.{img_type}")
                            with open(path, 'wb') as file:
                                file.write(response.content)
                            success += 1
                        else:
                            # console.print(f"[bold red]{response.status_code}[/]: Failed to download image (url: {img_url})") 
                            fail += 1 
                            failed_urls.append(img_url)

        return console.print(
            f"[bold green]{success} image files successfully downloaded and saved\n",
            f"[bold red]Failed to download {fail} image files\n", 
            f"Failed urls: {failed_urls}"
        )


class comment:
    def __init__(
        self,
        supabase_client: supabase.Client,
        db_name: str,
        paginate: bool or dict = True,
    ):
        """
        Initialize an instance for interacting with a Supabase table containing comment data.

        Args:
            supabase_client (supabase.Client): The Supabase client used for database interaction.
            db_name (str): The name of the Supabase table containing comment data.
            paginate (bool or dict, optional): Set to `True` to automatically paginate through large datasets.
                You can also provide a dictionary with "row_count" and "page_size" values.
                Defaults to False.

        Note:
            If your database has more than 1 million rows, it's recommended to set the paginate parameter to 
            ensure efficient data retrieval. You can set paginate to True for automatic settings or provide 
            a dictionary with "row_count" and "page_size" values. 
             
            For larger datasets, consider:
                1. Set "row_count" by checking row counts directly from the Supabase table editor. 
                It is common for large datasets to raise ReadTimeoutError, when counting the entire rows. 
                
                2. Adjust the "Max Rows" setting in 'API Settings' on Supabase, allowing you to retrieve up to 10,000 rows at a time. 
                The default limit to the amount of rows returned is 1,000 in Supabase.
            
        """
        self.supabase = supabase_client
        self.comment_db_config = db_name
        self.comment_db = self.supabase.table(self.comment_db_config)
        self.paginate = paginate

        self.columns = [
            "comment_id",
            "link_id",
            "subreddit",
            "parent_id",
            "redditor_id",
            "created_at",
            "body",
            "score",
            "edited",
            "removed",
        ]

        if self.paginate is True:
            self.row_count = (
                self.comment_db.select("comment_id", count="exact")
                .execute()
                .count
            )
            self.page_size = 1000
            self.page_numbers = (self.row_count // self.page_size) + (1 if self.row_count % self.page_size != 0 else 0)
        else:
            self.row_count = self.paginate.get(
                "row_count",
                self.comment_db.select("comment_id", count="exact")
                .execute()
                .count,
            )
            self.page_size = self.paginate.get("page_size", 1000)
            self.page_numbers = (self.row_count // self.page_size) + (1 if self.row_count % self.page_size != 0 else 0)

    def to_pkl(self, columns: List[str] or str, file_name: str, file_path: str = ""):
        """
        Save Supabase data to multiple .pickle files.

        Args:
            columns (Union[List[str], str]): A list of column names to select or "all" for all columns.
            file_name (str): The base name for the output files.
            file_path (str): The relative path to the directory where the .pickle files will be saved.

        Raises:
            ValueError: If the provided columns are not valid or if the input is neither a string nor a list.

        Returns:
            None. Prints the number of rows downloaded and the number of .pickle files created.
        """
        save_file_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../{file_path}")
        )
        if isinstance(columns, str):
            if columns.lower() == "all":
                columns = "*"
            else:
                raise ValueError(f"Invalid input: {columns}")
        elif isinstance(columns, list):
            invalid_columns = set(columns) - set(self.columns)
            if invalid_columns:
                raise ValueError(f"Invalid column names provided: {invalid_columns}")
        else:
            raise ValueError("Input is neither a string nor a list.")

        start_row, end_row = 0, self.page_size

        for page in track(
            range(1, self.page_numbers + 1),
            description=f"Downloading to .pickle file in {save_file_path}",
        ):
            if page == 1:
                pass
            elif page < (self.page_numbers - 1):
                    start_row += self.page_size
                    end_row += self.page_size
            else:
                start_row += self.page_size
                end_row = self.row_count
            
            paginated_comments = (
                self.comment_db.select(*columns).range(start_row, end_row).execute()
            ).model_dump()["data"]
            with open(f"{save_file_path}/{file_name}_{page}.pickle", "wb") as handle:
                pickle.dump(
                    paginated_comments, handle, protocol=pickle.HIGHEST_PROTOCOL
                )

        return console.print(
            f"{self.row_count} rows downloaded and saved in {self.page_numbers - 1} pickle files"
        )

    def to_csv(self, columns: List[str] or str, file_name: str, file_path: str = ""):
        """
        Save Supabase data to a .csv file.

        Args:
            columns (Union[List[str], str]): A list of column names to select or "all" for all columns.
            file_name (str): The base name for the output file.
            file_path (str): The relative path to the directory where the CSV file will be saved.

        Raises:
            ValueError: If the provided columns are not valid or if the input is neither a string nor a list.

        Returns:
            None. Prints the number of rows downloaded and the CSV file created.
        """

        save_file_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../{file_path}")
        )

        if isinstance(columns, str):
            if columns.lower() == "all":
                columns = "*"
            else:
                raise ValueError(f"Invalid input: {columns}")
        elif isinstance(columns, list):
            invalid_columns = set(columns) - set(self.columns)
            if invalid_columns:
                raise ValueError(f"Invalid column names provided: {invalid_columns}")
        else:
            raise ValueError("Input is neither a string nor a list.")

        start_row, end_row = 0, self.page_size

        with open(
            f"{save_file_path}/{file_name}.csv", "w", newline="", encoding="utf-8"
        ) as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(columns if columns != "*" else self.columns)

            for page in track(
                range(1, self.page_numbers + 1),
                description=f"Downloading to .csv file in {save_file_path}",
            ):
                if page == 1:
                    pass
                elif page < (self.page_numbers - 1):
                    start_row += self.page_size
                    end_row += self.page_size
                else:
                    start_row += self.page_size
                    end_row = self.row_count
                
                paginated_comments = (
                    self.comment_db.select(*columns)
                    .range(start_row, end_row)
                    .execute()
                ).model_dump()["data"]
                for row in paginated_comments:
                    writer.writerow(list(row.values()))

        return console.print(
            f"{self.row_count} rows downloaded and saved in {save_file_path}\{file_name}.csv"
        )

    def to_txt(self, columns: List[str] or str, file_name: str, file_path: str = ""):
        """
        Save Supabase data to a .txt file.

        Args:
            columns (Union[List[str], str]): A list of column names to select or "all" for all columns.
            file_name (str): The base name for the output file.
            file_path (str): The relative path to the directory where the TXT file will be saved.

        Raises:
            ValueError: If the provided columns are not valid or if the input is neither a string nor a list.

        Returns:
            None. Prints the number of rows downloaded and the TXT file created.
        """

        save_file_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../{file_path}")
        )

        if isinstance(columns, str):
            if columns.lower() == "all":
                columns = "*"
            else:
                raise ValueError(f"Invalid input: {columns}")
        elif isinstance(columns, list):
            invalid_columns = set(columns) - set(self.columns)
            if invalid_columns:
                raise ValueError(f"Invalid column names provided: {invalid_columns}")
        else:
            raise ValueError("Input is neither a string nor a list.")

        start_row, end_row = 0, self.page_size

        with open(
            f"{save_file_path}/{file_name}.txt", "w", encoding="utf-8"
        ) as txtfile:
            txtfile.write("\t".join(columns if columns != "*" else self.columns) + "\n")

            for page in track(
                range(1, self.page_numbers + 1),
                description=f"Downloading to .txt file in {save_file_path}",
            ):
                if page == 1:
                    pass
                elif page < (self.page_numbers - 1):
                    start_row += self.page_size
                    end_row += self.page_size
                else:
                    start_row += self.page_size
                    end_row = self.row_count
                
                paginated_comments = (
                    self.comment_db.select(*columns)
                    .range(start_row, end_row)
                    .execute()
                ).model_dump()["data"]
                for row in paginated_comments:
                    txtfile.write("\t".join(map(str, row.values())) + "\n")

        return console.print(
            f"{self.row_count} rows downloaded and saved in {save_file_path}\{file_name}.txt"
        )

    def to_json(self, columns: List[str] or str, file_name: str, file_path: str = ""):
        """
        Save Supabase data to multiple .json files.

        Args:
            columns (Union[List[str], str]): A list of column names to select or "all" for all columns.
            file_name (str): The base name for the output file.
            file_path (str): The relative path to the directory where the JSON file will be saved.

        Raises:
            ValueError: If the provided columns are not valid or if the input is neither a string nor a list.

        Returns:
            None. Prints the number of rows downloaded and the JSON file created.
        """
        # Similar to to_csv but saving to JSON format
        save_file_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../{file_path}")
        )

        if isinstance(columns, str):
            if columns.lower() == "all":
                columns = "*"
            else:
                raise ValueError(f"Invalid input: {columns}")
        elif isinstance(columns, list):
            invalid_columns = set(columns) - set(self.columns)
            if invalid_columns:
                raise ValueError(f"Invalid column names provided: {invalid_columns}")
        else:
            raise ValueError("Input is neither a string nor a list.")

        start_row, end_row = 0, self.page_size

        for page in track(
            range(1, self.page_numbers + 1),
            description=f"Downloading to .json file in {save_file_path}",
        ):
            if page == 1:
                pass
            elif page < (self.page_numbers - 1):
                    start_row += self.page_size
                    end_row += self.page_size
            else:
                start_row += self.page_size
                end_row = self.row_count
            
            paginated_comments = (
                self.comment_db.select(*columns).range(start_row, end_row).execute()
            ).model_dump()["data"]
            with open(
                f"{save_file_path}/{file_name}_{page}.json", "w", encoding="utf-8"
            ) as jsonfile:
                json.dump(paginated_comments, jsonfile, ensure_ascii=False, indent=2)

        return console.print(
            f"{self.row_count} rows downloaded and saved in {self.page_numbers - 1} json files"
        )

class user:
    def __init__(
        self,
        supabase_client: supabase.Client,
        db_name: str,
        paginate: bool or dict = True,
    ):
        """
        Initialize an instance for interacting with a Supabase table containing user data.

        Args:
            supabase_client (supabase.Client): The Supabase client used for database interaction.
            db_name (str): The name of the Supabase table containing comment data.
            paginate (bool or dict, optional): Set to `True` to automatically paginate through large datasets.
                You can also provide a dictionary with "row_count" and "page_size" values.
                Defaults to False.

        Note:
            If your database has more than 1 million rows, it's recommended to set the paginate parameter to 
            ensure efficient data retrieval. You can set paginate to True for automatic settings or provide 
            a dictionary with "row_count" and "page_size" values. 
             
            For larger datasets, consider:
                1. Set "row_count" by checking row counts directly from the Supabase table editor. 
                It is common for large datasets to raise ReadTimeoutError, when counting the entire rows. 
                
                2. Adjust the "Max Rows" setting in 'API Settings' on Supabase, allowing you to retrieve up to 10,000 rows at a time. 
                The default limit to the amount of rows returned is 1,000 in Supabase.
            
        """
        self.supabase = supabase_client
        self.redditor_db_config = db_name
        self.redditor_db = self.supabase.table(self.redditor_db_config)
        self.paginate = paginate

        self.columns = [
            "redditor_id",
            "name",
            "created_at",
            "karma",
            "is_gold",
            "is_mod",
            "trophy",
            "removed",
        ]

        if self.paginate is True:
            self.row_count = (
                self.redditor_db.select("redditor_id", count="exact")
                .execute()
                .count
            )
            self.page_size = 1000
            self.page_numbers = (self.row_count // self.page_size) + (1 if self.row_count % self.page_size != 0 else 0)
        else:
            self.row_count = self.paginate.get(
                "row_count",
                self.redditor_db.select("redditor_id", count="exact")
                .execute()
                .count,
            )
            self.page_size = self.paginate.get("page_size", 1000)
            self.page_numbers = (self.row_count // self.page_size) + (1 if self.row_count % self.page_size != 0 else 0)
        
    def to_pkl(self, columns: List[str] or str, file_name: str, file_path: str = "") -> None:
        """
        Save Supabase data to multiple .pickle files.

        Args:
            columns (Union[List[str], str]): A list of column names to select or "all" for all columns.
            file_name (str): The base name for the output files.
            file_path (str): The relative path to the directory where the .pickle files will be saved.

        Raises:
            ValueError: If the provided columns are not valid or if the input is neither a string nor a list.

        Returns:
            None. Prints the number of rows downloaded and the number of .pickle files created.
        """
        save_file_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../{file_path}")
        )
        if isinstance(columns, str):
            if columns.lower() == "all":
                columns = "*"
            else:
                raise ValueError(f"Invalid input: {columns}")
        elif isinstance(columns, list):
            invalid_columns = set(columns) - set(self.columns)
            if invalid_columns:
                raise ValueError(f"Invalid column names provided: {invalid_columns}")
        else:
            raise ValueError("Input is neither a string nor a list.")

        start_row, end_row = 0, self.page_size

        for page in track(
            range(1, self.page_numbers + 1),
            description=f"Downloading to .pickle file in {save_file_path}",
        ):
            if page == 1:
                pass
            elif page < (self.page_numbers - 1):
                    start_row += self.page_size
                    end_row += self.page_size
            else:
                start_row += self.page_size
                end_row = self.row_count
            
            paginated_redditors = (
                self.redditor_db.select(*columns).range(start_row, end_row).execute()
            ).model_dump()["data"]
            with open(f"{save_file_path}/{file_name}_{page}.pickle", "wb") as handle:
                pickle.dump(
                    paginated_redditors, handle, protocol=pickle.HIGHEST_PROTOCOL
                )

        return console.print(
            f"{self.row_count} rows downloaded and saved in {self.page_numbers - 1} pickle files"
        )

    def to_csv(self, columns: List[str] or str, file_name: str, file_path: str = ""):
        """
        Save Supabase data to a .csv file.

        Args:
            columns (Union[List[str], str]): A list of column names to select or "all" for all columns.
            file_name (str): The base name for the output file.
            file_path (str): The relative path to the directory where the CSV file will be saved.

        Raises:
            ValueError: If the provided columns are not valid or if the input is neither a string nor a list.

        Returns:
            None. Prints the number of rows downloaded and the CSV file created.
        """

        save_file_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../{file_path}")
        )

        if isinstance(columns, str):
            if columns.lower() == "all":
                columns = "*"
            else:
                raise ValueError(f"Invalid input: {columns}")
        elif isinstance(columns, list):
            invalid_columns = set(columns) - set(self.columns)
            if invalid_columns:
                raise ValueError(f"Invalid column names provided: {invalid_columns}")
        else:
            raise ValueError("Input is neither a string nor a list.")

        start_row, end_row = 0, self.page_size

        with open(
            f"{save_file_path}/{file_name}.csv", "w", newline="", encoding="utf-8"
        ) as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(columns if columns != "*" else self.columns)

            for page in track(
                range(1, self.page_numbers + 1),
                description=f"Downloading to .csv file in {save_file_path}",
            ):
                if page == 1:
                    pass
                elif page < (self.page_numbers - 1):
                    start_row += self.page_size
                    end_row += self.page_size
                else:
                    start_row += self.page_size
                    end_row = self.row_count
                
                paginated_redditors = (
                    self.redditor_db.select(*columns)
                    .range(start_row, end_row)
                    .execute()
                ).model_dump()["data"]
                for row in paginated_redditors:
                    writer.writerow(list(row.values()))

        return console.print(
            f"{self.row_count} rows downloaded and saved in {save_file_path}\{file_name}.csv"
        )

    def to_txt(self, columns: List[str] or str, file_name: str, file_path: str = ""):
        """
        Save Supabase data to a .txt file.

        Args:
            columns (Union[List[str], str]): A list of column names to select or "all" for all columns.
            file_name (str): The base name for the output file.
            file_path (str): The relative path to the directory where the TXT file will be saved.

        Raises:
            ValueError: If the provided columns are not valid or if the input is neither a string nor a list.

        Returns:
            None. Prints the number of rows downloaded and the TXT file created.
        """

        save_file_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../{file_path}")
        )

        if isinstance(columns, str):
            if columns.lower() == "all":
                columns = "*"
            else:
                raise ValueError(f"Invalid input: {columns}")
        elif isinstance(columns, list):
            invalid_columns = set(columns) - set(self.columns)
            if invalid_columns:
                raise ValueError(f"Invalid column names provided: {invalid_columns}")
        else:
            raise ValueError("Input is neither a string nor a list.")

        start_row, end_row = 0, self.page_size

        with open(
            f"{save_file_path}/{file_name}.txt", "w", encoding="utf-8"
        ) as txtfile:
            txtfile.write("\t".join(columns if columns != "*" else self.columns) + "\n")

            for page in track(
                range(1, self.page_numbers + 1),
                description=f"Downloading to .txt file in {save_file_path}",
            ):
                if page == 1:
                    pass
                elif page < (self.page_numbers - 1):
                    start_row += self.page_size
                    end_row += self.page_size
                else:
                    start_row += self.page_size
                    end_row = self.row_count
                
                paginated_redditors = (
                    self.redditor_db.select(*columns)
                    .range(start_row, end_row)
                    .execute()
                ).model_dump()["data"]
                for row in paginated_redditors:
                    txtfile.write("\t".join(map(str, row.values())) + "\n")

        return console.print(
            f"{self.row_count} rows downloaded and saved in {save_file_path}\{file_name}.txt"
        )

    def to_json(self, columns: List[str] or str, file_name: str, file_path: str = ""):
        """
        Save Supabase data to multiple .json files.

        Args:
            columns (Union[List[str], str]): A list of column names to select or "all" for all columns.
            file_name (str): The base name for the output file.
            file_path (str): The relative path to the directory where the JSON file will be saved.

        Raises:
            ValueError: If the provided columns are not valid or if the input is neither a string nor a list.

        Returns:
            None. Prints the number of rows downloaded and the JSON file created.
        """
        # Similar to to_csv but saving to JSON format
        save_file_path = os.path.abspath(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../{file_path}")
        )

        if isinstance(columns, str):
            if columns.lower() == "all":
                columns = "*"
            else:
                raise ValueError(f"Invalid input: {columns}")
        elif isinstance(columns, list):
            invalid_columns = set(columns) - set(self.columns)
            if invalid_columns:
                raise ValueError(f"Invalid column names provided: {invalid_columns}")
        else:
            raise ValueError("Input is neither a string nor a list.")

        start_row, end_row = 0, self.page_size

        for page in track(
            range(1, self.page_numbers + 1),
            description=f"Downloading to .json file in {save_file_path}",
        ):
            if page == 1:
                pass
            elif page < (self.page_numbers - 1):
                    start_row += self.page_size
                    end_row += self.page_size
            else:
                start_row += self.page_size
                end_row = self.row_count
            
            paginated_redditors = (
                self.redditor_db.select(*columns).range(start_row, end_row).execute()
            ).model_dump()["data"]
            with open(
                f"{save_file_path}/{file_name}_{page}.json", "w", encoding="utf-8"
            ) as jsonfile:
                json.dump(paginated_redditors, jsonfile, ensure_ascii=False, indent=2)

        return console.print(
            f"{self.row_count} rows downloaded and saved in {self.page_numbers} json files"
        )
