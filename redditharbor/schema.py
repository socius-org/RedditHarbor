"""
Column definitions for the RedditHarbor database tables.

RedditHarbor follows the principle of data minimisation (GDPR Art. 5(1)(c)):
nothing is collected unless you explicitly ask for it. When creating a
``collect`` or ``update`` instance you pass a ``columns`` dictionary that
lists, per table, the columns you need for your research. Only those columns
are requested from Reddit and stored in your database.

Example::

    columns = {
        "user": ["redditor_id", "created_at", "karma"],
        "submission": ["submission_id", "redditor_id", "created_at", "title", "text", "subreddit"],
        "comment": ["comment_id", "link_id", "redditor_id", "created_at", "body"],
    }

Tables you leave out (or set to ``None``) are not collected at all. The primary
key of each table (``redditor_id``, ``submission_id``, ``comment_id``) is
always included because rows cannot be stored or de-duplicated without it.
"""

from typing import Dict, Iterable, List, Optional

# Column name -> PostgreSQL type, in canonical order. The first entry of each
# table is its primary key.
USER_COLUMNS: Dict[str, str] = {
    "redditor_id": "varchar primary key",
    "name": "varchar",
    "created_at": "timestamptz",
    "karma": "jsonb",
    "is_gold": "boolean",
    "is_mod": "jsonb",
    "trophy": "jsonb",
    "removed": "varchar",
}

SUBMISSION_COLUMNS: Dict[str, str] = {
    "submission_id": "varchar primary key",
    "redditor_id": "varchar",
    "created_at": "timestamptz",
    "title": "varchar",
    "text": "text",
    "subreddit": "varchar",
    "permalink": "varchar",
    "attachment": "jsonb",
    "flair": "jsonb",
    "awards": "jsonb",
    "score": "jsonb",
    "upvote_ratio": "jsonb",
    "num_comments": "jsonb",
    "edited": "boolean",
    "archived": "boolean",
    "removed": "boolean",
    "poll": "jsonb",
}

COMMENT_COLUMNS: Dict[str, str] = {
    "comment_id": "varchar primary key",
    "link_id": "varchar",
    "subreddit": "varchar",
    "parent_id": "varchar",
    "redditor_id": "varchar",
    "created_at": "timestamptz",
    "body": "text",
    "score": "jsonb",
    "edited": "boolean",
    "removed": "varchar",
}

TABLES: Dict[str, Dict[str, str]] = {
    "user": USER_COLUMNS,
    "submission": SUBMISSION_COLUMNS,
    "comment": COMMENT_COLUMNS,
}

PRIMARY_KEYS: Dict[str, str] = {
    "user": "redditor_id",
    "submission": "submission_id",
    "comment": "comment_id",
}

ColumnConfig = Dict[str, Optional[List[str]]]

_EXAMPLE = (
    "    columns = {\n"
    '        "user": ["redditor_id", "created_at", "karma"],\n'
    '        "submission": ["submission_id", "redditor_id", "created_at", "title", "text", "subreddit"],\n'
    '        "comment": ["comment_id", "link_id", "redditor_id", "created_at", "body"],\n'
    "    }"
)


def validate_columns(columns: Optional[Dict[str, Optional[Iterable[str]]]]) -> ColumnConfig:
    """
    Normalise and validate a user-supplied column configuration.

    Args:
        columns (dict): Mapping of table ("user", "submission", "comment") to the
            list of column names to collect. A table that is missing, ``None`` or
            an empty list is not collected at all.

    Returns:
        dict: A dictionary with all three table keys. Each value is either a list
        of column names in canonical order (always starting with the primary
        key) or ``None`` when that table is not collected.

    Raises:
        ValueError: If ``columns`` is missing, has unknown table or column names,
            or configures no table at all.
    """
    if columns is None:
        raise ValueError(
            "Invalid input: `columns` must be provided. RedditHarbor only collects the "
            "columns you explicitly ask for (data minimisation). For example:\n"
            f"{_EXAMPLE}\n"
            "See `redditharbor.schema` for the full list of available columns."
        )
    if not isinstance(columns, dict):
        raise ValueError(
            "Invalid input: `columns` must be a dictionary mapping 'user', 'submission' "
            f"and/or 'comment' to a list of column names. For example:\n{_EXAMPLE}"
        )

    unknown_tables = set(columns) - set(TABLES)
    if unknown_tables:
        raise ValueError(
            f"Unknown table(s) in `columns`: {sorted(unknown_tables)}. "
            f"Valid tables are {list(TABLES)}."
        )

    validated: ColumnConfig = {}
    for table, available in TABLES.items():
        requested = columns.get(table)
        if requested is None:
            validated[table] = None
            continue
        if isinstance(requested, str):
            requested = [requested]
        try:
            requested = list(requested)
        except TypeError:
            raise ValueError(
                f"Invalid input: columns['{table}'] must be a list of column names, "
                f"got {type(requested).__name__}."
            )
        if not requested:
            validated[table] = None
            continue

        invalid = [c for c in requested if c not in available]
        if invalid:
            raise ValueError(
                f"Invalid column name(s) for '{table}': {invalid}. "
                f"Available columns are {list(available)}."
            )

        wanted = set(requested)
        wanted.add(PRIMARY_KEYS[table])
        validated[table] = [c for c in available if c in wanted]

    if all(v is None for v in validated.values()):
        raise ValueError(
            "Invalid input: `columns` configures no table. Specify at least one of "
            f"'user', 'submission' or 'comment'. For example:\n{_EXAMPLE}"
        )

    return validated


def create_table_sql(
    db_config: Dict[str, str],
    columns: Dict[str, Optional[Iterable[str]]],
    enable_rls: bool = True,
) -> str:
    """
    Generate the SQL needed to create Supabase tables matching a column configuration.

    Args:
        db_config (dict): Mapping of table ("user", "submission", "comment") to the
            name of the database table, e.g. ``{"user": "test_redditor", ...}``.
        columns (dict): The same column configuration you pass to ``collect``.
        enable_rls (bool, optional): Append ``ALTER TABLE ... ENABLE ROW LEVEL
            SECURITY`` for each table. Defaults to True.

    Returns:
        str: SQL statements you can paste into the Supabase SQL editor.
    """
    validated = validate_columns(columns)
    statements = []
    for table, selected in validated.items():
        if selected is None:
            continue
        table_name = db_config.get(table)
        if not table_name:
            raise ValueError(
                f"db_config is missing a table name for '{table}', which is configured in `columns`."
            )
        column_defs = ",\n".join(f"    {name} {TABLES[table][name]}" for name in selected)
        statements.append(
            f"-- Create table {table_name}\nCREATE TABLE {table_name} (\n{column_defs}\n);"
        )
        if enable_rls:
            statements.append(
                f"-- Enable row-level security on {table_name}\n"
                f"ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;"
            )
    return "\n\n".join(statements) + "\n"
