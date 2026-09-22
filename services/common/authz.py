from dataclasses import dataclass

from boto3.dynamodb.conditions import Key

from common.db import table, team_pk, user_sk


class Forbidden(Exception):
    pass


@dataclass(frozen=True)
class Claims:
    user_id: str
    org_id: str
    org_tier: str  # "admin" (Owner/Manager) or "staff" (Coach/Player/Physio)

    @property
    def is_org_admin(self) -> bool:
        return self.org_tier == "admin"


def get_claims(event: dict) -> Claims:
    """Every Lambda handler calls this first. Claims come from the Cognito
    JWT authorizer, not the request body -- never trust client-supplied
    orgId/userId for authorization decisions."""
    jwt_claims = event["requestContext"]["authorizer"]["jwt"]["claims"]
    org_id = jwt_claims.get("custom:orgId")
    org_tier = jwt_claims.get("custom:orgTier", "staff")
    if not org_id:
        raise Forbidden("user has no organization")
    return Claims(user_id=jwt_claims["sub"], org_id=org_id, org_tier=org_tier)


def require_same_org(claims: Claims, org_id: str) -> None:
    if claims.org_id != org_id:
        raise Forbidden("cross-organization access denied")


def require_org_admin(claims: Claims) -> None:
    if not claims.is_org_admin:
        raise Forbidden("requires Owner or Manager role")


def require_team_role(claims: Claims, team_id: str, allowed_roles: set[str]) -> None:
    """Owner/Manager bypass team-level checks (org-wide scope). Everyone else
    must hold one of allowed_roles on this specific team, per the
    TeamMembership join item."""
    if claims.is_org_admin:
        return
    resp = table().get_item(
        Key={"PK": team_pk(team_id), "SK": user_sk(claims.user_id)}
    )
    membership = resp.get("Item")
    if not membership or membership.get("orgId") != claims.org_id:
        raise Forbidden("not a member of this team")
    if membership["role"] not in allowed_roles:
        raise Forbidden(f"requires one of {allowed_roles} on this team")


def user_team_ids(user_id: str) -> set[str]:
    resp = table().query(
        IndexName="GSI1",
        KeyConditionExpression=Key("GSI1PK").eq(f"USER#{user_id}"),
    )
    return {i["teamId"] for i in resp.get("Items", []) if i["type"] == "MEMBERSHIP"}


def require_can_view_user(claims: Claims, target_user_id: str) -> None:
    """Org admins see everyone. Anyone can see their own profile. Otherwise
    the viewer and the target must share at least one team."""
    if claims.is_org_admin or claims.user_id == target_user_id:
        return
    if user_team_ids(claims.user_id) & user_team_ids(target_user_id):
        return
    raise Forbidden("not authorized to view this profile")


def require_can_edit_user(claims: Claims, target_user_id: str) -> None:
    if claims.is_org_admin or claims.user_id == target_user_id:
        return
    raise Forbidden("not authorized to edit this profile")
