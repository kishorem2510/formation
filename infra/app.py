#!/usr/bin/env python3
import os

import aws_cdk as cdk

from infra.infra_stack import InfraStack

app = cdk.App()

# Same-app landing + dashboard, so this is the one origin the API needs to
# trust. Add the deployed CloudFront/Amplify domain once it exists.
web_origins = [
    "http://localhost:3000",
]

InfraStack(
    app,
    "FormationStack",
    web_origins=web_origins,
    env=cdk.Environment(
        account=os.getenv("CDK_DEFAULT_ACCOUNT"),
        region=os.getenv("CDK_DEFAULT_REGION"),
    ),
)

app.synth()
