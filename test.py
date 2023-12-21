# from redditharbor.dock.pipeline import collect
# import redditharbor.login as login 
from rich.console import Console 
console = Console()
# from redditharbor.utils import download 
# from redditharbor.utils import fetch 

# reddit_client = login.reddit()
# supabase_client = login.supabase()

# DB_CONFIG = {
#         "user": "test_redditor",
#         "submission": "test_submission",
#         "comment": "test_comment",
#     }

# collect = collect(reddit_client=reddit_client, supabase_client=supabase_client, db_config=DB_CONFIG)
# collect.subreddit_submission(subreddits=["AskReddit"], sort_types=["new"])
# collect.subreddit_comment(subreddits=["AskReddit"], sort_types=["new"])
# collect.subreddit_submission_and_comment(subreddits=["AskReddit"], sort_types=["new"])

# collect.comment_from_user(user_names=["WorldNewsMods", "AcademicPattern2737", "EveningGalaxy"], sort_types=["hot"])
# collect.submission_from_user(user_names=["WorldNewsMods", "AcademicPattern2737", "EveningGalaxy"], sort_types=["hot"])

# print(os.path.dirname(__file__)) 

# test_columns = ["submission_id", "redditor_id", "created_at", "title", "text"]

# download = download.user(supabase_client=supabase_client, db_name="test_redditor")

# download.to_json(columns = "all", file_name="all", file_path="")

# fetch = fetch.user(supabase_client=supabase_client, db_name="test_redditor")

# print(fetch.name(limit=10))

from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

text="James Bond's mobile number is 212-555-5555"

# Set up the engine, loads the NLP module (spaCy model by default) 
# and other PII recognizers
analyzer = AnalyzerEngine()

# Call analyzer to get results
results = analyzer.analyze(text=text,
                           language='en')

console.print("Results: ", results)

# Analyzer results are passed to the AnonymizerEngine for anonymization

anonymizer = AnonymizerEngine()

anonymized_text = anonymizer.anonymize(text=text, analyzer_results=results)

console.print(anonymized_text.text)