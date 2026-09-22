import uuid
from datetime import datetime, timezone

from aws_lambda_powertools.event_handler import APIGatewayHttpResolver
from aws_lambda_powertools.event_handler.exceptions import BadRequestError, NotFoundError
from boto3.dynamodb.conditions import Key

from common.authz import Forbidden, get_claims, require_org_admin, require_same_org, require_team_role
from common.db import table, org_pk, team_pk, user_sk
from common.responses import error

app = APIGatewayHttpResolver()

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


def lambda_handler(event, context):
    return app.resolve(event, context)
