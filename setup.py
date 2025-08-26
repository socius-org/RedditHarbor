from setuptools import setup, find_packages
import os

# Safely read README
here = os.path.abspath(os.path.dirname(__file__))
try:
    with open(os.path.join(here, 'README.md'), encoding='utf-8') as f:
        long_description = f.read()
except FileNotFoundError:
    long_description = 'Effortlessly collect and store Reddit data in your database.'

setup(
    name='redditharbor',
    packages=find_packages(),
    version='0.3',
    license='MIT',
    description='Effortlessly collect and store Reddit data in your database.',
    long_description=long_description,
    long_description_content_type='text/markdown',
    author='Nick Oh',
    author_email='nick.sh.oh@socius.org',
    url='https://github.com/socius-org/RedditHarbor/',
    download_url='https://github.com/socius-org/RedditHarbor/archive/refs/tags/0.3.tar.gz',
    keywords=['Reddit', 'Supabase', 'reddit-api', 'database', 'reddit-crawler', 'reddit-scraper'],
    include_package_data=True,
    python_requires='>=3.8',
    install_requires=[
        'praw>=7.7.1',
        'supabase>=1.0.3',
        'rich>=13.4.2',
        'python-dotenv>=1.0.0',
        'pillow>=10.3.0,<12.0.0',
        'requests>=2.32.4,<3.0.0'
    ],
    extras_require={
        'pii': [
            'spacy>=3.7.0,<4.0.0',
            'presidio-analyzer>=2.2.351,<3.0.0',
            'presidio-anonymizer>=2.2.351,<3.0.0',
        ],
    },
    classifiers=[
        'Development Status :: 3 - Alpha', 
        'Intended Audience :: Developers',
        'Intended Audience :: Science/Research',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python :: 3',
        'Programming Language :: Python :: 3.8',
        'Programming Language :: Python :: 3.9',
        'Programming Language :: Python :: 3.10',
        'Programming Language :: Python :: 3.11',
        'Programming Language :: Python :: 3.12',
        'Programming Language :: Python :: 3.13',
        'Topic :: Software Development :: Libraries :: Python Modules',
        'Topic :: Internet :: WWW/HTTP :: Dynamic Content',
        'Topic :: Database',
    ],
    project_urls={
        'Bug Reports': 'https://github.com/socius-org/RedditHarbor/issues',
        'Source': 'https://github.com/socius-org/RedditHarbor/',
        'Documentation': 'https://github.com/socius-org/RedditHarbor/blob/main/README.md',
    },
)