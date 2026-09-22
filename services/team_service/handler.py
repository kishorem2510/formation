import os
import uuid
from datetime import datetime, timezone

import boto3
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver
from aws_lambda_powertools.event_handler.exceptions import BadRequestError, NotFoundError
from boto3.dynamodb.conditions import Key

from common.authz import (
    Forbidden,
    get_claims,
    require_org_admin,
    require_same_org,
    require_team_role,
    user_team_ids,
)
from common.db import table, org_pk, team_pk, user_sk
from common.responses import error

app = APIGatewayHttpResolver()
_cognito = boto3.client("cognito-idp")

ALL_TEAM_ROLES = {"COACH", "PLAYER", "PHYSIO"}


@app.exception_handler(Forbidden)
def handle_forbidden(exc: Forbidden):
    return error(str(exc), status=403)


@app.post("/orgs/<org_id>/teams")
def create_team(org_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_same_org(claims, org_id)
    require_org_admin(claims)

    body = app.current_event.json_body
    name = body.get("name")
    if not name:
        raise BadRequestError("name is required")

    team_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "PK": org_pk(org_id),
        "SK": team_pk(team_id),
        "type": "TEAM",
        "teamId": team_id,
        "orgId": org_id,
        "name": name,
        "sport": body.get("sport"),
        "ageGroup": body.get("ageGroup"),
        "createdAt": now,
    }
    table().put_item(Item=item)
    return item


@app.get("/orgs/<org_id>/teams")
def list_teams(org_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_same_org(claims, org_id)
    require_org_admin(claims)

    resp = table().query(
        KeyConditionExpression=Key("PK").eq(org_pk(org_id)) & Key("SK").begins_with("TEAM#")
    )
    return resp.get("Items", [])


@app.get("/teams/<team_id>")
def get_team(team_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_team_role(claims, team_id, ALL_TEAM_ROLES)

    item = table().get_item(Key={"PK": org_pk(claims.org_id), "SK": team_pk(team_id)}).get("Item")
    if not item:
        raise NotFoundError("team not found")
    return item


@app.put("/teams/<team_id>")
def update_team(team_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_org_admin(claims)

    body = app.current_event.json_body
    updates = {k: v for k, v in body.items() if k in {"name", "sport", "ageGroup"}}
    if not updates:
        raise BadRequestError("nothing to update")

    expr_names = {f"#{k}": k for k in updates}
    expr_values = {f":{k}": v for k, v in updates.items()}
    table().update_item(
        Key={"PK": org_pk(claims.org_id), "SK": team_pk(team_id)},
        UpdateExpression="SET " + ", ".join(f"#{k} = :{k}" for k in updates),
        ExpressionAttributeNames=expr_names,
        ExpressionAttributeValues=expr_values,
    )
    return {"teamId": team_id, **updates}


@app.delete("/teams/<team_id>")
def delete_team(team_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_org_admin(claims)
    table().delete_item(Key={"PK": org_pk(claims.org_id), "SK": team_pk(team_id)})
    return {"deleted": team_id}


@app.get("/teams/<team_id>/members")
def list_members(team_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_team_role(claims, team_id, ALL_TEAM_ROLES)

    resp = table().query(
        KeyConditionExpression=Key("PK").eq(team_pk(team_id)) & Key("SK").begins_with("USER#")
    )
    return resp.get("Items", [])


@app.post("/teams/<team_id>/members")
def add_member(team_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_org_admin(claims)

    body = app.current_event.json_body
    user_id = body.get("userId")
    role = body.get("role")
    if not user_id or role not in ALL_TEAM_ROLES:
        raise BadRequestError(f"userId required, role must be one of {ALL_TEAM_ROLES}")

    now = datetime.now(timezone.utc).isoformat()
    item = {
        "PK": team_pk(team_id),
        "SK": user_sk(user_id),
        "type": "MEMBERSHIP",
        "GSI1PK": f"USER#{user_id}",
        "GSI1SK": team_pk(team_id),
        "teamId": team_id,
        "userId": user_id,
        "orgId": claims.org_id,
        "role": role,
        "joinedAt": now,
    }
    table().put_item(Item=item)
    return item


@app.delete("/teams/<team_id>/members/<user_id>")
def remove_member(team_id: str, user_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_org_admin(claims)
    table().delete_item(Key={"PK": team_pk(team_id), "SK": user_sk(user_id)})
    return {"removed": user_id}


@app.get("/orgs/<org_id>/members")
def list_org_members(org_id: str):
    """Flat, org-wide roster for the Team Management page. Org admins see
    everyone; everyone else sees only people they share a team with."""
    claims = get_claims(app.current_event.raw_event)
    require_same_org(claims, org_id)

    t = table()
    users_resp = t.query(
        KeyConditionExpression=Key("PK").eq(org_pk(org_id)) & Key("SK").begins_with("USER#")
    )
    users_by_id = {u["userId"]: {**u, "teams": []} for u in users_resp.get("Items", [])}

    teams_resp = t.query(
        KeyConditionExpression=Key("PK").eq(org_pk(org_id)) & Key("SK").begins_with("TEAM#")
    )
    team_ids = [tm["teamId"] for tm in teams_resp.get("Items", [])]

    if not claims.is_org_admin:
        visible_team_ids = user_team_ids(claims.user_id)
        team_ids = [tid for tid in team_ids if tid in visible_team_ids]

    for team_id in team_ids:
        members_resp = t.query(
            KeyConditionExpression=Key("PK").eq(team_pk(team_id)) & Key("SK").begins_with("USER#")
        )
        for m in members_resp.get("Items", []):
            entry = users_by_id.get(m["userId"])
            if entry:
                entry["teams"].append({"teamId": team_id, "role": m["role"]})

    if claims.is_org_admin:
        result = list(users_by_id.values())
    else:
        # Staff only ever see people on a team they're also on -- this
        # naturally excludes Owner/Manager, who hold no team memberships.
        result = [u for u in users_by_id.values() if u["teams"]]

    return [
        {
            "userId": u["userId"],
            "name": u["name"],
            "email": u["email"],
            "orgRole": u["orgRole"],
            "status": u.get("status", "ACTIVE"),
            "teams": u["teams"],
        }
        for u in result
    ]


@app.delete("/orgs/<org_id>/members/<user_id>")
def remove_org_member(org_id: str, user_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_same_org(claims, org_id)
    require_org_admin(claims)

    if user_id == claims.user_id:
        raise BadRequestError("cannot remove yourself")

    t = table()
    target = t.get_item(Key={"PK": org_pk(org_id), "SK": user_sk(user_id)}).get("Item")
    if not target:
        raise NotFoundError("member not found")
    if target.get("orgRole") == "OWNER":
        raise Forbidden("the Owner cannot be removed")

    for team_id in user_team_ids(user_id):
        t.delete_item(Key={"PK": team_pk(team_id), "SK": user_sk(user_id)})
    t.delete_item(Key={"PK": org_pk(org_id), "SK": user_sk(user_id)})

    _cognito.admin_delete_user(UserPoolId=os.environ["USER_POOL_ID"], Username=target["email"])
    return {"removed": user_id}


def lambda_handler(event, context):
    return app.resolve(event, context)
