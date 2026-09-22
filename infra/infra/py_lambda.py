import os

from aws_cdk import BundlingOptions, Duration
from aws_cdk import aws_lambda as lambda_

SERVICES_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "..", "..", "services")
)

# All service Lambdas share one code asset (the whole services/ directory,
# with third-party deps installed into it via Docker bundling so behavior is
# identical regardless of host OS). boto3 is deliberately left out of
# requirements.txt since the Lambda runtime already provides it.
_CODE = lambda_.Code.from_asset(
    SERVICES_DIR,
    bundling=BundlingOptions(
        image=lambda_.Runtime.PYTHON_3_13.bundling_image,
        command=[
            "bash",
            "-c",
            "pip install -r requirements.txt -t /asset-output && cp -r . /asset-output",
        ],
    ),
)


def service_function(
    scope,
    construct_id: str,
    *,
    handler: str,
    environment: dict | None = None,
    timeout: Duration = Duration.seconds(10),
    memory_size: int = 256,
) -> lambda_.Function:
    return lambda_.Function(
        scope,
        construct_id,
        runtime=lambda_.Runtime.PYTHON_3_13,
        code=_CODE,
        handler=handler,
        timeout=timeout,
        memory_size=memory_size,
        environment=environment or {},
        tracing=lambda_.Tracing.ACTIVE,
    )
