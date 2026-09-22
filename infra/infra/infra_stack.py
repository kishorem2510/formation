from aws_cdk import CfnOutput, Stack
from constructs import Construct

from infra.constructs.api import Api
from infra.constructs.auth import AuthStack
from infra.constructs.data import DataStore
from infra.constructs.storage import DocumentStorage


class InfraStack(Stack):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        *,
        web_origins: list[str],
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        data = DataStore(self, "Data")
        storage = DocumentStorage(self, "Storage", allowed_origins=web_origins)
        auth = AuthStack(self, "Auth", table=data.table)
        api = Api(
            self,
            "Api",
            table=data.table,
            bucket=storage.bucket,
            user_pool=auth.user_pool,
            user_pool_client=auth.user_pool_client,
            cors_origins=web_origins,
        )

        CfnOutput(self, "TableName", value=data.table.table_name)
        CfnOutput(self, "DocumentsBucketName", value=storage.bucket.bucket_name)
        CfnOutput(self, "UserPoolId", value=auth.user_pool.user_pool_id)
        CfnOutput(self, "UserPoolClientId", value=auth.user_pool_client.user_pool_client_id)
        CfnOutput(self, "ApiUrl", value=api.http_api.url or "")
