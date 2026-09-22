import uuid
from datetime import datetime, timezone

from aws_lambda_powertools.event_handler import APIGatewayHttpResolver
from aws_lambda_powertools.event_handler.exceptions import BadRequestError, NotFoundError
from boto3.dynamodb.conditions import Attr, Key

from common.authz import Forbidden, get_claims, require_team_role
from common.db import table, event_sk, team_pk
from common.responses import error

app = APIGatewayHttpResolver()

CAN_MANAGE_EVENTS = {"COACH"}
CAN_VIEW_EVENTS = {"COACH", "PLAYER", "PHYSIO"}


@app.exception_handler(Forbidden)
def handle_forbidden(exc: Forbidden):
    return error(str(exc), status=403)


def _find_event(team_id: str, event_id: str):
    resp = table().query(
        KeyConditionExpression=Key("PK").eq(team_pk(team_id)) & Key("SK").begins_with("EVENT#"),
        FilterExpression=Attr("eventId").eq(event_id),
    )
    items = resp.get("Items", [])
    return items[0] if items else None


@app.post("/teams/<team_id>/events")
def create_event(team_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_team_role(claims, team_id, CAN_MANAGE_EVENTS)

    body = app.current_event.json_body
    start_time = body.get("startTime")  # ISO 8601
    event_type = body.get("eventType")
    if not start_time or event_type not in {"GAME", "PRACTICE"}:
        raise BadRequestError("startTime (ISO 8601) and eventType (GAME|PRACTICE) are required")

    event_id = str(uuid.uuid4())
    date_part = start_time.split("T")[0]
    now = datetime.now(timezone.utc).isoformat()
    item = {
        "PK": team_pk(team_id),
        "SK": event_sk(date_part, event_id),
        "type": "EVENT",
        "eventId": event_id,
        "teamId": team_id,
        "orgId": claims.org_id,
        "eventType": event_type,
        "startTime": start_time,
        "endTime": body.get("endTime"),
        "location": body.get("location"),
        "notes": body.get("notes"),
        "createdBy": claims.user_id,
        "createdAt": now,
    }
    table().put_item(Item=item)
    return item


@app.get("/teams/<team_id>/events")
def list_events(team_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_team_role(claims, team_id, CAN_VIEW_EVENTS)

    resp = table().query(
        KeyConditionExpression=Key("PK").eq(team_pk(team_id)) & Key("SK").begins_with("EVENT#")
    )
    return resp.get("Items", [])


@app.get("/teams/<team_id>/events/<event_id>")
def get_event(team_id: str, event_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_team_role(claims, team_id, CAN_VIEW_EVENTS)

    item = _find_event(team_id, event_id)
    if not item:
        raise NotFoundError("event not found")
    return item


@app.put("/teams/<team_id>/events/<event_id>")
def update_event(team_id: str, event_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_team_role(claims, team_id, CAN_MANAGE_EVENTS)

    existing = _find_event(team_id, event_id)
    if not existing:
        raise NotFoundError("event not found")

    body = app.current_event.json_body
    updates = {
        k: v for k, v in body.items()
        if k in {"eventType", "startTime", "endTime", "location", "notes"}
    }
    if not updates:
        raise BadRequestError("nothing to update")

    table().update_item(
        Key={"PK": existing["PK"], "SK": existing["SK"]},
        UpdateExpression="SET " + ", ".join(f"#{k} = :{k}" for k in updates),
        ExpressionAttributeNames={f"#{k}": k for k in updates},
        ExpressionAttributeValues={f":{k}": v for k, v in updates.items()},
    )
    return {"eventId": event_id, **updates}


@app.delete("/teams/<team_id>/events/<event_id>")
def delete_event(team_id: str, event_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_team_role(claims, team_id, CAN_MANAGE_EVENTS)

    existing = _find_event(team_id, event_id)
    if not existing:
        raise NotFoundError("event not found")
    table().delete_item(Key={"PK": existing["PK"], "SK": existing["SK"]})
    return {"deleted": event_id}


def lambda_handler(event, context):
    return app.resolve(event, context)
