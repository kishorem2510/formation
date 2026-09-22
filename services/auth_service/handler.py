import os
from datetime import datetime, timezone

import boto3
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver
from aws_lambda_powertools.event_handler.exceptions import BadRequestError
from boto3.dynamodb.conditions import Key

from common.authz import (
    Forbidden,
    get_claims,
    require_can_edit_user,
    require_can_view_user,
    require_org_admin,
    require_same_org,
)
from common.db import table, org_pk, team_pk, user_sk
from common.password import validate_password
from common.responses import error

app = APIGatewayHttpResolver()
_cognito = boto3.client("cognito-idp")

ORG_WIDE_ROLES = {"MANAGER"}
TEAM_SCOPED_ROLES = {"COACH", "PLAYER", "PHYSIO"}

# Athlete profile fields -- free-text so users pick their own units/format
# (e.g. "5'10\"" or "178 cm"), editable by the user themselves or an org admin.
PROFILE_FIELDS = ("dob", "height", "weight", "jerseySize")


@app.exception_handler(Forbidden)
def handle_forbidden(exc: Forbidden):
    return error(str(exc), status=403)


@app.post("/orgs/<org_id>/invites")
def invite_user(org_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_same_org(claims, org_id)
    require_org_admin(claims)

    body = app.current_event.json_body
    email = body.get("email")
    name = body.get("name", email)
    role = body.get("role")
    team_id = body.get("teamId")
    # Present -> Owner/Manager is hand-creating credentials to relay
    # out-of-band (Flow 2). Absent -> Cognito emails its own invite with an
    # auto-generated temporary password (Flow 1). Either way the user hits
    # the same NEW_PASSWORD_REQUIRED challenge on first sign-in.
    manual_password = body.get("password")

    if role not in ORG_WIDE_ROLES | TEAM_SCOPED_ROLES:
        raise BadRequestError(f"role must be one of {ORG_WIDE_ROLES | TEAM_SCOPED_ROLES}")
    if role in TEAM_SCOPED_ROLES and not team_id:
        raise BadRequestError("teamId is required for team-scoped roles")
    if manual_password is not None:
        password_error = validate_password(manual_password)
        if password_error:
            raise BadRequestError(password_error)

    org_tier = "admin" if role in ORG_WIDE_ROLES else "staff"
    now = datetime.now(timezone.utc).isoformat()

    user_pool_id = os.environ["USER_POOL_ID"]

    create_kwargs = {
        "UserPoolId": user_pool_id,
        "Username": email,
        "UserAttributes": [
            {"Name": "email", "Value": email},
            {"Name": "email_verified", "Value": "true"},
            {"Name": "name", "Value": name},
            {"Name": "custom:orgId", "Value": org_id},
            {"Name": "custom:orgTier", "Value": org_tier},
        ],
    }
    if manual_password is not None:
        create_kwargs["TemporaryPassword"] = manual_password
        create_kwargs["MessageAction"] = "SUPPRESS"
    else:
        create_kwargs["DesiredDeliveryMediums"] = ["EMAIL"]

    _cognito.admin_create_user(**create_kwargs)
    # AdminCreateUser assigns Cognito's own `sub`; look it up so our
    # DynamoDB records key off the real Cognito user id, not our uuid.
    created = _cognito.admin_get_user(UserPoolId=user_pool_id, Username=email)
    cognito_sub = next(
        a["Value"] for a in created["UserAttributes"] if a["Name"] == "sub"
    )

    t = table()
    t.put_item(
        Item={
            "PK": org_pk(org_id),
            "SK": user_sk(cognito_sub),
            "type": "USER",
            "GSI1PK": f"USER#{cognito_sub}",
            "GSI1SK": org_pk(org_id),
            "userId": cognito_sub,
            "orgId": org_id,
            "email": email,
            "name": name,
            "orgRole": role if role in ORG_WIDE_ROLES else "MEMBER",
            "status": "INVITED",
            "createdAt": now,
        }
    )
    if role in TEAM_SCOPED_ROLES:
        t.put_item(
            Item={
                "PK": team_pk(team_id),
                "SK": user_sk(cognito_sub),
                "type": "MEMBERSHIP",
                "GSI1PK": f"USER#{cognito_sub}",
                "GSI1SK": team_pk(team_id),
                "teamId": team_id,
                "userId": cognito_sub,
                "orgId": org_id,
                "role": role,
                "joinedAt": now,
            }
        )

    response = {"userId": cognito_sub, "email": email, "role": role, "status": "INVITED"}
    if manual_password is not None:
        # Returned exactly once, in this response -- never persisted, never
        # retrievable again. The Owner must copy/relay it immediately.
        response["temporaryPassword"] = manual_password
    return response


def _serialize_profile(profile: dict, teams: list[dict]) -> dict:
    out = {
        "userId": profile["userId"],
        "orgId": profile["orgId"],
        "email": profile["email"],
        "name": profile["name"],
        "orgRole": profile["orgRole"],
        "status": profile.get("status", "ACTIVE"),
        "teams": [{"teamId": tm["teamId"], "role": tm["role"]} for tm in teams],
    }
    for field in PROFILE_FIELDS:
        out[field] = profile.get(field)
    return out


@app.get("/orgs/<org_id>")
def get_org(org_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_same_org(claims, org_id)

    item = table().get_item(Key={"PK": org_pk(org_id), "SK": org_pk(org_id)}).get("Item")
    if not item:
        return error("organization not found", status=404)
    return {"orgId": item["orgId"], "name": item["name"], "createdAt": item["createdAt"]}


@app.get("/me")
def me():
    claims = get_claims(app.current_event.raw_event)
    t = table()
    resp = t.query(
        IndexName="GSI1",
        KeyConditionExpression=Key("GSI1PK").eq(f"USER#{claims.user_id}"),
    )
    items = resp.get("Items", [])
    profile = next((i for i in items if i["type"] == "USER"), None)
    teams = [i for i in items if i["type"] == "MEMBERSHIP"]
    if not profile:
        return error("user profile not found", status=404)
    return _serialize_profile(profile, teams)


@app.get("/users/<user_id>")
def get_user(user_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_can_view_user(claims, user_id)

    t = table()
    profile = t.get_item(Key={"PK": org_pk(claims.org_id), "SK": user_sk(user_id)}).get("Item")
    if not profile:
        return error("user not found", status=404)

    teams_resp = t.query(
        IndexName="GSI1",
        KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}"),
    )
    teams = [i for i in teams_resp.get("Items", []) if i["type"] == "MEMBERSHIP"]
    return _serialize_profile(profile, teams)


@app.put("/users/<user_id>")
def update_user(user_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_can_edit_user(claims, user_id)

    body = app.current_event.json_body
    updates = {k: v for k, v in body.items() if k in {"name", *PROFILE_FIELDS}}
    if not updates:
        raise BadRequestError("nothing to update")

    t = table()
    key = {"PK": org_pk(claims.org_id), "SK": user_sk(user_id)}
    if not t.get_item(Key=key).get("Item"):
        return error("user not found", status=404)

    t.update_item(
        Key=key,
        UpdateExpression="SET " + ", ".join(f"#{k} = :{k}" for k in updates),
        ExpressionAttributeNames={f"#{k}": k for k in updates},
        ExpressionAttributeValues={f":{k}": v for k, v in updates.items()},
    )
    return {"userId": user_id, **updates}


def lambda_handler(event, context):
    return app.resolve(event, context)
