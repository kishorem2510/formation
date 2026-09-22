import os
import uuid
from datetime import datetime, timezone

import boto3
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver
from aws_lambda_powertools.event_handler.exceptions import BadRequestError, NotFoundError
from boto3.dynamodb.conditions import Attr, Key

from common.authz import Forbidden, get_claims, require_org_admin, require_same_org
from common.db import table, org_pk, update_sk
from common.responses import error

app = APIGatewayHttpResolver()
_s3 = boto3.client("s3")
_BUCKET = os.environ.get("DOCS_BUCKET", "")
PRESIGN_EXPIRY_SECONDS = 300


@app.exception_handler(Forbidden)
def handle_forbidden(exc: Forbidden):
    return error(str(exc), status=403)


@app.post("/orgs/<org_id>/updates")
def create_update(org_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_same_org(claims, org_id)
    require_org_admin(claims)

    body = app.current_event.json_body
    title = body.get("title")
    message = body.get("body")
    file_name = body.get("fileName")
    content_type = body.get("contentType", "application/octet-stream")
    if not title or not message:
        raise BadRequestError("title and body are required")

    update_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    date_part = now.split("T")[0]

    item = {
        "PK": org_pk(org_id),
        "SK": update_sk(date_part, update_id),
        "type": "UPDATE",
        "updateId": update_id,
        "orgId": org_id,
        "authorId": claims.user_id,
        "title": title,
        "body": message,
        "createdAt": now,
    }

    upload_url = None
    if file_name:
        s3_key = f"orgs/{org_id}/updates/{update_id}/{file_name}"
        item["attachment"] = {"s3Key": s3_key, "fileName": file_name}
        upload_url = _s3.generate_presigned_url(
            "put_object",
            Params={"Bucket": _BUCKET, "Key": s3_key, "ContentType": content_type},
            ExpiresIn=PRESIGN_EXPIRY_SECONDS,
        )

    table().put_item(Item=item)
    return {"updateId": update_id, "uploadUrl": upload_url}


@app.get("/orgs/<org_id>/updates")
def list_updates(org_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_same_org(claims, org_id)

    resp = table().query(
        KeyConditionExpression=Key("PK").eq(org_pk(org_id)) & Key("SK").begins_with("UPDATE#"),
        ScanIndexForward=False,
    )
    return resp.get("Items", [])


@app.get("/orgs/<org_id>/updates/<update_id>/download")
def download_attachment(org_id: str, update_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_same_org(claims, org_id)

    item = _find_update(org_id, update_id)
    if not item or "attachment" not in item:
        raise NotFoundError("update or attachment not found")

    download_url = _s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": _BUCKET, "Key": item["attachment"]["s3Key"]},
        ExpiresIn=PRESIGN_EXPIRY_SECONDS,
    )
    return {"downloadUrl": download_url, "fileName": item["attachment"]["fileName"]}


@app.delete("/orgs/<org_id>/updates/<update_id>")
def delete_update(org_id: str, update_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_same_org(claims, org_id)
    require_org_admin(claims)

    item = _find_update(org_id, update_id)
    if not item:
        raise NotFoundError("update not found")
    table().delete_item(Key={"PK": item["PK"], "SK": item["SK"]})
    return {"deleted": update_id}


def _find_update(org_id: str, update_id: str) -> dict | None:
    resp = table().query(
        KeyConditionExpression=Key("PK").eq(org_pk(org_id)) & Key("SK").begins_with("UPDATE#"),
        FilterExpression=Attr("updateId").eq(update_id),
    )
    items = resp.get("Items", [])
    return items[0] if items else None


def lambda_handler(event, context):
    return app.resolve(event, context)
