import os
import uuid
from datetime import datetime, timezone

import boto3
from aws_lambda_powertools.event_handler import APIGatewayHttpResolver
from aws_lambda_powertools.event_handler.exceptions import BadRequestError, NotFoundError
from boto3.dynamodb.conditions import Key

from common.authz import Forbidden, get_claims, require_team_role
from common.db import table, doc_sk, team_pk
from common.responses import error

app = APIGatewayHttpResolver()
_s3 = boto3.client("s3")
_BUCKET = os.environ.get("DOCS_BUCKET", "")

CAN_UPLOAD = {"COACH", "PHYSIO"}
CAN_VIEW = {"COACH", "PLAYER", "PHYSIO"}
PRESIGN_EXPIRY_SECONDS = 300


@app.exception_handler(Forbidden)
def handle_forbidden(exc: Forbidden):
    return error(str(exc), status=403)


@app.post("/teams/<team_id>/documents/presign")
def presign_upload(team_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_team_role(claims, team_id, CAN_UPLOAD)

    body = app.current_event.json_body
    file_name = body.get("fileName")
    content_type = body.get("contentType", "application/octet-stream")
    category = body.get("category", "GENERAL")
    if not file_name:
        raise BadRequestError("fileName is required")

    doc_id = str(uuid.uuid4())
    s3_key = f"orgs/{claims.org_id}/teams/{team_id}/documents/{doc_id}/{file_name}"
    now = datetime.now(timezone.utc).isoformat()

    table().put_item(
        Item={
            "PK": team_pk(team_id),
            "SK": doc_sk(doc_id),
            "type": "DOCUMENT",
            "docId": doc_id,
            "teamId": team_id,
            "orgId": claims.org_id,
            "fileName": file_name,
            "s3Key": s3_key,
            "category": category,
            "uploadedBy": claims.user_id,
            "createdAt": now,
        }
    )

    upload_url = _s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": _BUCKET, "Key": s3_key, "ContentType": content_type},
        ExpiresIn=PRESIGN_EXPIRY_SECONDS,
    )
    return {"docId": doc_id, "uploadUrl": upload_url, "s3Key": s3_key}


@app.get("/teams/<team_id>/documents")
def list_documents(team_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_team_role(claims, team_id, CAN_VIEW)

    resp = table().query(
        KeyConditionExpression=Key("PK").eq(team_pk(team_id)) & Key("SK").begins_with("DOC#")
    )
    return resp.get("Items", [])


@app.get("/teams/<team_id>/documents/<doc_id>/download")
def presign_download(team_id: str, doc_id: str):
    claims = get_claims(app.current_event.raw_event)
    require_team_role(claims, team_id, CAN_VIEW)

    item = table().get_item(Key={"PK": team_pk(team_id), "SK": doc_sk(doc_id)}).get("Item")
    if not item:
        raise NotFoundError("document not found")

    download_url = _s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": _BUCKET, "Key": item["s3Key"]},
        ExpiresIn=PRESIGN_EXPIRY_SECONDS,
    )
    return {"docId": doc_id, "downloadUrl": download_url, "fileName": item["fileName"]}


def lambda_handler(event, context):
    return app.resolve(event, context)
