import { Amplify } from "aws-amplify";

let configured = false;

/** Idempotent -- safe to call from any client component on mount. */
export function configureAmplify() {
  if (configured) return;
  configured = true;

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "",
        userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? "",
      },
    },
  });
}
