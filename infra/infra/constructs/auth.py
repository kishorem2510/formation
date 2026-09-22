from aws_cdk import Duration, RemovalPolicy
from aws_cdk import aws_cognito as cognito
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_iam as iam
from constructs import Construct

from infra.py_lambda import service_function


class AuthStack(Construct):
    """Cognito is AuthN only -- fine-grained authorization happens in each
    Lambda handler against DynamoDB (see services/common/authz.py). The two
    triggers here exist solely to stamp orgId/orgTier onto the user so the
    pre-token-generation trigger can embed them as JWT claims without a
    per-login DB read.
    """

    def __init__(self, scope: Construct, construct_id: str, *, table: dynamodb.Table) -> None:
        super().__init__(scope, construct_id)

        pre_token_fn = service_function(
            self,
            "PreTokenGenerationFn",
            handler="auth_service.pre_token_trigger.lambda_handler",
        )

        post_confirmation_fn = service_function(
            self,
            "PostConfirmationFn",
            handler="auth_service.post_confirmation_trigger.lambda_handler",
            environment={"TABLE_NAME": table.table_name},
        )
        table.grant_read_write_data(post_confirmation_fn)

        self.user_pool = cognito.UserPool(
            self,
            "UserPool",
            self_sign_up_enabled=True,
            sign_in_aliases=cognito.SignInAliases(email=True),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            standard_attributes=cognito.StandardAttributes(
                email=cognito.StandardAttribute(required=True, mutable=False),
                fullname=cognito.StandardAttribute(required=False, mutable=True),
            ),
            custom_attributes={
                "orgId": cognito.StringAttribute(mutable=True),
                "orgTier": cognito.StringAttribute(mutable=True),
            },
            # Mirrors apps/web/src/lib/schemas.ts passwordSchema -- keep the
            # two in sync so the client-side checklist never promises
            # something Cognito then rejects.
            password_policy=cognito.PasswordPolicy(
                min_length=8,
                require_lowercase=False,
                require_uppercase=True,
                require_digits=True,
                require_symbols=False,
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.DESTROY,
            lambda_triggers=cognito.UserPoolTriggers(
                post_confirmation=post_confirmation_fn,
            ),
        )

        # Pre-token-generation trigger uses the V2_0 event shape
        # (claimsAndScopeOverrideDetails) -- must be registered via
        # add_trigger, not the simple V1 slot in UserPoolTriggers.
        self.user_pool.add_trigger(
            cognito.UserPoolOperation.PRE_TOKEN_GENERATION_CONFIG,
            pre_token_fn,
            lambda_version=cognito.LambdaVersion.V2_0,
        )

        # PostConfirmation needs to write custom:orgId/orgTier back onto the
        # very user it was triggered for. Resource is "*" (not
        # user_pool.user_pool_arn) deliberately: CDK already wires
        # UserPool -> Function for the trigger, so a policy statement that
        # references the pool's ARN token would create Function -> Policy ->
        # UserPool -> Function, a circular CloudFormation dependency. The
        # action itself stays tightly scoped; only the resource is broad.
        post_confirmation_fn.add_to_role_policy(
            iam.PolicyStatement(
                actions=["cognito-idp:AdminUpdateUserAttributes"],
                resources=["*"],
            )
        )

        self.user_pool_client = self.user_pool.add_client(
            "WebClient",
            auth_flows=cognito.AuthFlow(user_srp=True, admin_user_password=True),
            o_auth=cognito.OAuthSettings(
                flows=cognito.OAuthFlows(authorization_code_grant=True),
            ),
            access_token_validity=Duration.minutes(60),
            id_token_validity=Duration.minutes(60),
            refresh_token_validity=Duration.days(30),
            prevent_user_existence_errors=True,
        )
