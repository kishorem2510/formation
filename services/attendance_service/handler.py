from datetime import datetime, timezone

from aws_lambda_powertools.event_handler import APIGatewayHttpResolver
from aws_lambda_powertools.event_handler.exceptions import BadRequestError
from boto3.dynamodb.conditions import Key

from common.authz import Forbidden, get_claims, require_team_role
from common.db import table, event_pk, user_sk
from common.responses import error

app = APIGatewayHttpResolver()

CAN_MARK_ATTENDANCE = {"COACH"}
CAN_VIEW_ATTENDANCE = {"COACH", "PLAYER", "PHYSIO"}
VALID_STATUSES = {"PRESENT", "ABSENT", "EXCUSED"}


@app.exception_handler(Forbidden)
def handle_forbidden(exc: Forbidden):
    return error(str(exc), status=403)


@app.put("/teams/<team_id>/events/<event_id>/attendance/<user_id>")
def mark_attendance(team_id: str, event_id: str, user_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_team_role(claims, team_id, CAN_MARK_ATTENDANCE)

    body = app.current_event.json_body
    status = body.get("status")
    if status not in VALID_STATUSES:
        raise BadRequestError(f"status must be one of {VALID_STATUSES}")

    now = datetime.now(timezone.utc).isoformat()
    item = {
        "PK": event_pk(event_id),
        "SK": user_sk(user_id),
        "type": "ATTENDANCE",
        "GSI2PK": f"USER#{user_id}",
        "GSI2SK": event_pk(event_id),
        "eventId": event_id,
        "teamId": team_id,
        "userId": user_id,
        "orgId": claims.org_id,
        "status": status,
        "markedBy": claims.user_id,
        "markedAt": now,
    }
    table().put_item(Item=item)
    return item


@app.get("/teams/<team_id>/events/<event_id>/attendance")
def list_attendance(team_id: str, event_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_team_role(claims, team_id, CAN_VIEW_ATTENDANCE)

    resp = table().query(
        KeyConditionExpression=Key("PK").eq(event_pk(event_id)) & Key("SK").begins_with("USER#")
    )
    return resp.get("Items", [])


@app.get("/users/<user_id>/attendance")
def user_attendance_history(user_id: str):
    claims = get_claims(app.current_event.raw_event)
    if claims.user_id != user_id and not claims.is_org_admin:
        return error("can only view your own attendance history", status=403)

    resp = table().query(
        IndexName="GSI2",
        KeyConditionExpression=Key("GSI2PK").eq(f"USER#{user_id}"),
    )
    return resp.get("Items", [])


def lambda_handler(event, context):
    return app.resolve(event, context)
