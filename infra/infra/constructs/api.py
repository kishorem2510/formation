from aws_cdk import Duration, Stack
from aws_cdk import aws_apigatewayv2 as apigwv2
from aws_cdk import aws_apigatewayv2_authorizers as authorizers
from aws_cdk import aws_apigatewayv2_integrations as integrations
from aws_cdk import aws_cognito as cognito
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_iam as iam
from aws_cdk import aws_s3 as s3
from constructs import Construct

from infra.py_lambda import service_function

# (method, path, lambda logical id in the `fns` dict below)
ROUTES = [
    ("POST", "/orgs/{org_id}/invites", "AuthFn"),
    ("GET", "/me", "AuthFn"),
    ("POST", "/orgs/{org_id}/teams", "TeamFn"),
    ("GET", "/orgs/{org_id}/teams", "TeamFn"),
    ("GET", "/teams/{team_id}", "TeamFn"),
    ("PUT", "/teams/{team_id}", "TeamFn"),
    ("DELETE", "/teams/{team_id}", "TeamFn"),
    ("GET", "/teams/{team_id}/members", "TeamFn"),
    ("POST", "/teams/{team_id}/members", "TeamFn"),
    ("DELETE", "/teams/{team_id}/members/{user_id}", "TeamFn"),
    ("POST", "/teams/{team_id}/events", "ScheduleFn"),
    ("GET", "/teams/{team_id}/events", "ScheduleFn"),
    ("GET", "/teams/{team_id}/events/{event_id}", "ScheduleFn"),
    ("PUT", "/teams/{team_id}/events/{event_id}", "ScheduleFn"),
    ("DELETE", "/teams/{team_id}/events/{event_id}", "ScheduleFn"),
    ("PUT", "/teams/{team_id}/events/{event_id}/attendance/{user_id}", "AttendanceFn"),
    ("GET", "/teams/{team_id}/events/{event_id}/attendance", "AttendanceFn"),
    ("GET", "/users/{user_id}/attendance", "AttendanceFn"),
    ("POST", "/teams/{team_id}/documents/presign", "DocsFn"),
    ("GET", "/teams/{team_id}/documents", "DocsFn"),
    ("GET", "/teams/{team_id}/documents/{doc_id}/download", "DocsFn"),
]

_HTTP_METHOD = {
    "GET": apigwv2.HttpMethod.GET,
    "POST": apigwv2.HttpMethod.POST,
    "PUT": apigwv2.HttpMethod.PUT,
    "DELETE": apigwv2.HttpMethod.DELETE,
}


class Api(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        table: dynamodb.Table,
        bucket: s3.Bucket,
        user_pool: cognito.UserPool,
        user_pool_client: cognito.UserPoolClient,
        cors_origins: list[str],
    ) -> None:
        super().__init__(scope, construct_id)

        common_env = {"TABLE_NAME": table.table_name}

        fns = {
            "AuthFn": service_function(
                self,
                "AuthFn",
                handler="auth_service.handler.lambda_handler",
                environment={**common_env, "USER_POOL_ID": user_pool.user_pool_id},
            ),
            "TeamFn": service_function(
                self, "TeamFn", handler="team_service.handler.lambda_handler", environment=common_env
            ),
            "ScheduleFn": service_function(
                self, "ScheduleFn", handler="schedule_service.handler.lambda_handler", environment=common_env
            ),
            "AttendanceFn": service_function(
                self, "AttendanceFn", handler="attendance_service.handler.lambda_handler", environment=common_env
            ),
            "DocsFn": service_function(
                self,
                "DocsFn",
                handler="docs_service.handler.lambda_handler",
                environment={**common_env, "DOCS_BUCKET": bucket.bucket_name},
                timeout=Duration.seconds(15),
            ),
        }

        for fn in fns.values():
            table.grant_read_write_data(fn)
        bucket.grant_read_write(fns["DocsFn"])
        fns["AuthFn"].add_to_role_policy(
            iam.PolicyStatement(
                actions=[
                    "cognito-idp:AdminCreateUser",
                    "cognito-idp:AdminGetUser",
                ],
                resources=[user_pool.user_pool_arn],
            )
        )

        region = Stack.of(self).region
        authorizer = authorizers.HttpJwtAuthorizer(
            "JwtAuthorizer",
            jwt_issuer=f"https://cognito-idp.{region}.amazonaws.com/{user_pool.user_pool_id}",
            jwt_audience=[user_pool_client.user_pool_client_id],
        )

        self.http_api = apigwv2.HttpApi(
            self,
            "HttpApi",
            cors_preflight=apigwv2.CorsPreflightOptions(
                allow_origins=cors_origins,
                allow_methods=[apigwv2.CorsHttpMethod.ANY],
                allow_headers=["Authorization", "Content-Type"],
            ),
            default_authorizer=authorizer,
        )

        for method, path, fn_key in ROUTES:
            slug = path.replace("/", "-").replace("{", "").replace("}", "")
            self.http_api.add_routes(
                path=path,
                methods=[_HTTP_METHOD[method]],
                integration=integrations.HttpLambdaIntegration(
                    f"{fn_key}-{method}{slug}", fns[fn_key]
                ),
            )
