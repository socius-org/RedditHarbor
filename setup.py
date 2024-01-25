from setuptools import setup

setup(
  name = 'redditharbor',
  packages = ['redditharbor'],   
  version = '0.2',      
  license='MIT',        
  description = 'A tool designed to effortlessly collect and store Reddit data in a Supabase database.',   
  author = 'Nick S.H Oh',                   
  author_email = 'research@socius.org',      
  url = 'https://github.com/socius-org/RedditHarbor/',  
  download_url = 'https://github.com/socius-org/RedditHarbor/archive/refs/tags/0.2.tar.gz', 
  keywords = ['Reddit', 'Supabase', 'reddit-api', 'database', 'reddit-crawler', 'reddit-scraper'],
  include_package_data=True,
  install_requires=[
          'praw == 7.7.1',
          'supabase == 1.0.3', 
          'rich == 13.4.2',
          'python-dotenv == 1.0.0',
          'presidio-analyzer == 2.2.351', 
          'presidio-anonymizer == 2.2.351',
          'pillow == 10.2.0', 
          'requests == 2.31.0'  
      ],
  extras_require={
    'pii': ['spacy[en_core_web_lg]'],
    }
)