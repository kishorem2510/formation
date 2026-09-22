"""Cognito Post Confirmation trigger -- fires only for the self-service
sign-up flow (a new Org Owner confirming their email). Invited users
(Coach/Player/Physio/Manager) are created via AdminCreateUser in
handler.py's invite endpoint and never hit this trigger, since they don't
call ConfirmSignUp.

Expects the frontend to pass `orgName` in Cognito's signUp clientMetadata.
"""
import os
import uuid
from datetime import datetime, timezone

import boto3

from common.db import table, org_pk, user_sk

_cognito = boto3.client("cognito-idp")


def lambda_handler(event, context):
    attrs = event["request"]["userAttributes"]
    org_name = event["request"].get("clientMetadata", {}).get("orgName")
    if not org_name:
        # Not an org-creation signup (e.g. this pool is reused for another
        # flow later) -- nothing to do.
        return event

    user_id = attrs["sub"]
    email = attrs["email"]
    org_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    t = table()
    t.put_item(
        Item={
            "PK": org_pk(org_id),
            "SK": org_pk(org_id),
            "type": "ORG",
            "orgId": org_id,
            "name": org_name,
            "ownerId": user_id,
            "createdAt": now,
        }
    )
    t.put_item(
        Item={
            "PK": org_pk(org_id),
            "SK": user_sk(user_id),
            "type": "USER",
            "GSI1PK": f"USER#{user_id}",
            "GSI1SK": org_pk(org_id),
            "userId": user_id,
            "orgId": org_id,
            "email": email,
            "name": attrs.get("name", email),
            "orgRole": "OWNER",
            "status": "ACTIVE",
            "createdAt": now,
        }
    )

    _cognito.admin_update_user_attributes(
        UserPoolId=event["userPoolId"],
        Username=event["userName"],
        UserAttributes=[
            {"Name": "custom:orgId", "Value": org_id},
            {"Name": "custom:orgTier", "Value": "admin"},
        ],
    )

    return event
