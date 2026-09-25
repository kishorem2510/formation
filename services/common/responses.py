import json
import decimal
from typing import Any

from aws_lambda_powertools.event_handler import Response


class _DecimalEncoder(json.JSONEncoder):
    def default(self, o: Any) -> Any:
        if isinstance(o, decimal.Decimal):
            return int(o) if o % 1 == 0 else float(o)
        return super().default(o)


def ok(body: Any, status: int = 200) -> Response:
    """Powertools' APIGatewayHttpResolver requires handlers -- exception
    handlers especially -- to return an actual Response object, not a raw
    {"statusCode", "headers", "body"} dict. It assigns whatever an exception
    handler returns straight to self.response with no wrapping, then calls
    self.response.is_json(); a plain dict there crashes with
    AttributeError: 'dict' object has no attribute 'is_json'."""
    return Response(
        status_code=status,
        content_type="application/json",
        body=json.dumps(body, cls=_DecimalEncoder),
    )


def error(message: str, status: int = 400) -> Response:
    return ok({"error": message}, status)
