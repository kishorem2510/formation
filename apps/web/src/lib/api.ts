import { fetchAuthSession } from "aws-amplify/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function authHeader(): Promise<Record<string, string>> {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    // No valid session (expired/revoked refresh token, storage cleared,
    // etc). Send the request without a token rather than throwing here --
    // the API rejects it with a clean 401, which every caller already
    // handles uniformly (see AuthGuard's redirect-to-login on 401).
    return {};
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeader()),
    ...init?.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const body = await res.json().catch(() => undefined);

  if (!res.ok) {
    // Our own Lambda errors use {"error": "..."}; API Gateway's own 401
    // (rejected before reaching a Lambda at all, e.g. a missing/expired/
    // invalid JWT) uses {"message": "..."} instead. res.statusText is
    // empty on HTTP/2 responses (no reason phrase in the status line),
    // which API Gateway serves over -- so without this fallback chain the
    // error message silently renders as an empty string.
    throw new ApiError(res.status, body?.error ?? body?.message ?? `HTTP ${res.status}`);
  }
  return body as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
