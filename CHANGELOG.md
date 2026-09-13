# Changelog

All notable changes to RedditHarbor are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [0.4.0] - 2026-09-13

### Deprecation notice

**RedditHarbor 0.3 and earlier are deprecated and no longer supported.** Please upgrade
(`pip install --upgrade redditharbor`) and follow the
[migration guide](https://socius-org.github.io/RedditHarbor/getting_started/migration.html).
Reasons:

- They collect every predefined column by default, which is incompatible with the GDPR
  principle of data minimisation.
- They were written for Supabase's legacy `anon` / `service_role` JWT keys, which Supabase
  is retiring by the end of 2026, and for the 1.x Python client.
- They target PRAW 7, which has been superseded by PRAW 8.

### Breaking changes

- `collect` and `update` now require a `columns` argument listing, per table, the columns
  to collect. Nothing is collected unless it is listed. Tables left out of `columns` are
  not collected at all; primary keys are always included.
- Python 3.10 or later is required (PRAW 8 and supabase-py 2.27+ dropped 3.9).
- Dependencies now require `praw>=8.0,<9.0` and `supabase>=2.0,<3.0`.
- `login.supabase()` raises `ValueError` if given a publishable key (`sb_publishable_...`),
  since RedditHarbor needs write access. It warns if given a legacy `service_role` JWT key.
- `download.<table>.to_csv()` / `to_txt()` with `columns="all"` now write a header matching
  the columns actually present in the table instead of the fixed list of all known columns.
- Suspended Reddit accounts are stored as `"suspended"` (with no user row) unless the user
  `name` column is collected, in which case the previous `"suspended:<name>"` behaviour applies.

### Added

- `redditharbor.schema`: column definitions and types for all three tables,
  `validate_columns()` and `create_table_sql()` to generate the matching `CREATE TABLE` SQL.
- Documentation: "Choosing Columns" page with per-column personal-data guidance, and an
  "Upgrading from 0.3" migration guide.
- Support for Supabase's new secret keys (`sb_secret_...`).
- An update notice when a newer release is on PyPI (disable with
  `REDDITHARBOR_NO_UPDATE_CHECK=1`).
- `redditharbor.__version__`.

### Fixed

- Extra API calls for `is_mod` and `trophy` are only made when those columns are requested.
- `download.submission.to_csv()` ignored the configured page size.
- Documentation examples for `submission_from_user` and `comment_from_user` used the wrong
  keyword argument.

## [0.3] - 2025-08-26

- Flexible dependency ranges and Python 3.13 compatibility.
- PII dependencies moved to the optional `redditharbor[pii]` extra.

## [0.2.4] - 2024-06-02

- Last release of the 0.2 series (ICWSM tutorial).
