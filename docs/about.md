# About

## Navigating 🧭 the complexities of APIs and data collection can be a daunting task, especially for researchers 👨‍💻 with limited coding backgrounds. 
## **RedditHarbor simplifies collecting Reddit data and saving 📥 it to a database**. It **removes the complexity** of working with APIs 🏗️, letting you easily build a "harbor" of data for analysis.

```{warning}
**RedditHarbor 0.3 and earlier are deprecated.** They collect every column by default, which is incompatible with GDPR data minimisation, and depend on Supabase's legacy API keys, which Supabase is retiring by the end of 2026. Upgrade with `pip install --upgrade redditharbor` and see [Upgrading from 0.3](getting_started/migration.md).
```

## Overview 

### Extract, Transform and Load (ETL) Data

RedditHarbor streamlines the ETL (Extract, Transform, Load) process, enabling researchers to efficiently collect and store transformed Reddit data for analysis. 

**Extract**: RedditHarbor connects directly to the Reddit Data API, seamlessly retrieving submissions, comments, and user profiles. 

**Transform**: To safeguard user privacy and comply with ethical research practices, RedditHarbor allows researchers to anonymise any personally identifiable information (PII) present in the data. 

**Load**: The collected and transformed data is securely stored in a database of your choice, ensuring organised and accessible data management. 

### RedditHarbor 

[RedditHarbor](https://github.com/socius-org/RedditHarbor/) is designed for researchers who want to focus on their analysis rather than grappling with technical complexities. While third party API tools, such as [PRAW](https://praw.readthedocs.io/en/stable/), offer flexibility for advanced users, RedditHarbor simplifies the process, allowing you to effortlessly collect the data you need through intuitive commands.

Here's how RedditHarbor empowers your research:

* **✨ Comprehensive Data Collection**: Connect directly to the Reddit Data API and gather submissions, comments, and user profiles with ease.
* **🧹 Data Minimisation**: In line with GDPR, you choose exactly which columns to collect. Anything you do not ask for is neither requested from Reddit nor stored.
* **🔒 Privacy-Focused**: Anonymise any personally identifiable information (PII) to protect user privacy and comply with ethical research practices and IRB requirements.
* **📦 Organised Data Storage**: Store your collected data in a secure database that you control, ensuring accessibility and organisation.
* **📈 Scalable and Efficient**: Handle pagination seamlessly, even for large datasets with millions of rows. 
* **🕹️ Customisable Collection**: Tailor your data collection to your specific needs by configuring parameters.
* **📂 Analysis-Ready**: Export your database to CSV, JSON, or JPEG formats for effortless integration with your preferred analysis tools.
* **🔄 Temporal Metric Tracking**: Regularly update key metrics like upvote ratios, scores, awards, and comment counts, allowing temporal analysis - a distinct advantage over static "snapshot" databases, such as PushShift or AcademicTorrent. 
* **⚡ Smart Update Intervals**: Leverage flexible configurations to automatically adjust update intervals based on dataset size, optimising efficiency while adhering to API constraints. 

With RedditHarbor, you can spend less time wrestling with technical hurdles and more time focusing on your research objectives. 