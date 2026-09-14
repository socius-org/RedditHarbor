# Prerequisites

## Reddit API

1. **Create a Reddit Account**: You will need a Reddit account to access the Reddit API. If you don't have one already, head over to [reddit.com](https://www.reddit.com/) and sign up for a new account.

2. **Register as a Developer**: Follow [Reddit's API guide](https://www.reddit.com/wiki/api/) to [register as a developer](https://reddithelp.com/hc/en-us/requests/new?ticket_form_id=14868593862164). This step is necessary to create a script app and obtain the required credentials for API access.
<br>
```{image} ../images/reddit_register.png
:width: 400px
:align: center
```
<br>

3. **Create a Script App**: Once registered as a developer, create a [script app](https://old.reddit.com/prefs/apps/). This will provide you with the `PUBLIC_KEY` and `SECRET_KEY` credentials needed to authenticate with the Reddit API during the tutorial.
<br>
```{image} ../images/reddit_createapp.png
:width: 400px
:align: center
```
<br>

## Supabase API

1. **Sign Up for Supabase**: Visit [supabase.com](https://supabase.com/) and sign up for a new account. This will allow you to create a project and obtain the necessary credentials for storing the Reddit data.

2. **Create a New Project**: After signing up, create a new project in Supabase. Give it a name, choose a strong database password and the region closest to you. Under "Security", keep **Enable Data API** ticked: RedditHarbor talks to your database through the Data API. Once the project is ready, it has a project `URL` of the form `https://<project-id>.supabase.co` (shown under "Settings > Data API", or by clicking "Connect" at the top of the dashboard).
<br>
```{image} ../images/supabase_createnewproject.png
:width: 400px
:align: center
```
<br>

3. **Access Credentials**: Open "Settings > API Keys". On the *Publishable and secret API keys* tab, reveal and copy the **Secret key** (it starts with `sb_secret_`). This is the `SECRET_KEY` you will use as `SUPABASE_KEY`; it allows RedditHarbor to write to your tables. Do **not** use the *Publishable key* (`sb_publishable_`): it has no write access, and RedditHarbor will refuse it.
<br>
```{image} ../images/supabase_apikey.png
:width: 400px
:align: center
```
<br>

```{note}
Supabase is retiring the legacy `anon` and `service_role` keys (shown on the *Legacy anon, service_role API keys* tab) by the end of 2026. They still work for now, and RedditHarbor prints a warning if you use one, but new projects should use the secret key described above. If you followed an older version of this guide, see [Upgrading from 0.3](migration.md).
```

## Environment Setup

1. **Install Visual Studio Code (Recommended)**: We recommend [installing Visual Studio Code](https://code.visualstudio.com/download), a popular and user-friendly code editor. Once installed, make sure to get the Python extension for full support in running and editing Python apps.

   Alternatively, you can use your preferred code editor or IDE, but please note that Jupyter Notebook is not the ideal workspace for running RedditHarbor.

2. **Install Python**: Install a supported version of Python on your system:
   - **Windows**: [Install Python from python.org](https://www.python.org/downloads/). Use the "Download Python" button that appears first on the page to download the latest version.
   - **macOS**: The system install of Python on macOS is not supported. Instead, we recommend using a package management system like [Homebrew](https://brew.sh/). To install Python using Homebrew on macOS, run `brew install python3` in the Terminal.

3. **Install Python Extension (for Visual Studio Code users)**: If you're using Visual Studio Code, open the editor and navigate to the sidebar (or press `Ctrl+Shift+X`). Search for "python" in the Extensions Marketplace and install the Python extension.

## Command Prompt (Windows Users)

If you're a Windows user, we recommend using Git Bash, one of the best command prompts for a Linux-style command-line experience. Follow these steps:

1. [Download Git Bash](https://gitforwindows.org/)
2. Follow the setup wizard, selecting all the default options
3. At the "Adjusting your PATH environment" step, select the "Use Git from the Windows Command Prompt" option
4. Once installed, you will have access to Git Bash, which provides Linux-style command-line utilities and Git functionality in Windows.

If you run into difficulties during setup, open an issue on [GitHub](https://github.com/socius-org/RedditHarbor/issues).