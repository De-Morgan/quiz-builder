import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { http, UNAUTHORIZED_EVENT } from "./api";
import { clearToken, setToken } from "./token";

type Handler = { fulfilled: (v: unknown) => unknown; rejected: (e: unknown) => unknown };

const requestHandlers = (http.interceptors.request as unknown as { handlers: Handler[] })
  .handlers;
const responseHandlers = (http.interceptors.response as unknown as { handlers: Handler[] })
  .handlers;

// handlers[0] = auth header, first registered request interceptor
const attachAuth = requestHandlers[0]!.fulfilled;
// response handlers: [0] envelope unwrap, [1] error normaliser
const unwrapEnvelope = responseHandlers[0]!.fulfilled;
const normaliseError = responseHandlers[1]!.rejected;

describe("request interceptor", () => {
  afterEach(() => {
    clearToken();
  });

  it("attaches a Bearer token from storage", () => {
    setToken("abc.def");
    const config = attachAuth({ headers: {} }) as { headers: Record<string, string> };
    expect(config.headers.Authorization).toBe("Bearer abc.def");
  });

  it("adds no Authorization header when there is no token", () => {
    const config = attachAuth({ headers: {} }) as { headers: Record<string, string> };
    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe("response envelope unwrapping", () => {
  it("replaces the body with the inner data payload", () => {
    const res = unwrapEnvelope({
      data: { success: true, statusCode: 200, path: "/x", data: { id: "1" } },
    }) as { data: unknown };
    expect(res.data).toEqual({ id: "1" });
  });

  it("leaves a non-enveloped body untouched", () => {
    const res = unwrapEnvelope({ data: [1, 2, 3] }) as { data: unknown };
    expect(res.data).toEqual([1, 2, 3]);
  });
});

describe("error normalisation", () => {
  beforeEach(() => {
    setToken("stale");
  });
  afterEach(() => {
    clearToken();
  });

  it("clears the token and emits qb:unauthorized on a 401", async () => {
    const onEvent = vi.fn();
    window.addEventListener(UNAUTHORIZED_EVENT, onEvent);

    await expect(
      normaliseError({ response: { status: 401, data: {} } }),
    ).rejects.toMatchObject({ status: 401 });

    expect(onEvent).toHaveBeenCalledTimes(1);
    expect(window.localStorage.getItem("qb_token")).toBeNull();
    window.removeEventListener(UNAUTHORIZED_EVENT, onEvent);
  });

  it("joins an array message into a single string", async () => {
    await expect(
      normaliseError({
        response: { status: 400, data: { message: ["too short", "required"] } },
      }),
    ).rejects.toMatchObject({ status: 400, message: "too short, required" });
  });

  it("falls back to error.message when the response has none", async () => {
    await expect(
      normaliseError({ message: "Network Error" }),
    ).rejects.toMatchObject({ status: 0, message: "Network Error" });
  });
});
