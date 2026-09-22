import os
import boto3

_TABLE_NAME = os.environ.get("TABLE_NAME", "")
_resource = boto3.resource("dynamodb")


def table():
    return _resource.Table(_TABLE_NAME)


# ---- Key builders -----------------------------------------------------
# Single-table design. See infra/README for the full entity/GSI map.

def org_pk(org_id: str) -> str:
    return f"ORG#{org_id}"


def user_sk(user_id: str) -> str:
    return f"USER#{user_id}"


def team_sk(team_id: str) -> str:
    return f"TEAM#{team_id}"


def team_pk(team_id: str) -> str:
    return f"TEAM#{team_id}"


def event_pk(event_id: str) -> str:
    return f"EVENT#{event_id}"


def event_sk(event_date_iso: str, event_id: str) -> str:
    return f"EVENT#{event_date_iso}#{event_id}"


def doc_sk(doc_id: str) -> str:
    return f"DOC#{doc_id}"


def gsi1pk_user(user_id: str) -> str:
    return f"USER#{user_id}"
