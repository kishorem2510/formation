from aws_cdk import RemovalPolicy
from aws_cdk import aws_s3 as s3
from constructs import Construct


class DocumentStorage(Construct):
    """Bucket for team/org documents (medical forms, rosters, general docs).
    Clients never get IAM creds to this bucket directly -- all access is via
    short-lived presigned URLs minted by docs_service after an RBAC check.
    """

    def __init__(self, scope: Construct, construct_id: str, *, allowed_origins: list[str]) -> None:
        super().__init__(scope, construct_id)

        self.bucket = s3.Bucket(
            self,
            "DocumentsBucket",
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            encryption=s3.BucketEncryption.S3_MANAGED,
            enforce_ssl=True,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.PUT, s3.HttpMethods.GET],
                    allowed_origins=allowed_origins,
                    allowed_headers=["*"],
                    max_age=3000,
                )
            ],
        )
