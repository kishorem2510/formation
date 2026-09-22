"""Cognito Pre Token Generation trigger.

Embeds orgId/orgTier as custom JWT claims so API Lambdas can read them
straight off the token (see common.authz.get_claims) without a DynamoDB
lookup on every request. The values are read from the user's Cognito
custom attributes, which are set once at account-creation time
(post_confirmation_trigger.py for org owners, auth_service handler.py's
invite endpoint for everyone else).
"""


def lambda_handler(event, context):
    attrs = event["request"]["userAttributes"]
    org_id = attrs.get("custom:orgId", "")
    org_tier = attrs.get("custom:orgTier", "staff")

    event["response"]["claimsAndScopeOverrideDetails"] = {
        "idTokenGeneration": {
            "claimsToAddOrOverride": {
                "custom:orgId": org_id,
                "custom:orgTier": org_tier,
            }
        },
        "accessTokenGeneration": {
            "claimsToAddOrOverride": {
                "custom:orgId": org_id,
                "custom:orgTier": org_tier,
            }
        },
    }
    return event
