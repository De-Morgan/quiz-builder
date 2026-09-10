import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

const httpGet = vi.fn();
const httpPost = vi.fn();
vi.mock("@/lib/api", () => ({
  UNAUTHORIZED_EVENT: "qb:unauthorized",
  http: {
    get: (...args: unknown[]) => httpGet(...args),
    post: (...args: unknown[]) => httpPost(...args),
  },
}));

const setToken = vi.fn();
const clearToken = vi.fn();
const getToken = vi.fn(() => null as string | null);
vi.mock("@/lib/token", () => ({
  setToken: (t: string) => setToken(t),
  clearToken: () => clearToken(),
  getToken: () => getToken(),
}));

import { Providers, useAuth } from "./providers";

function Consumer() {
  const { status, login } = useAuth();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <button onClick={() => login("me@example.com", "secret1")}>login</button>
    </div>
  );
}

beforeEach(() => {
  getToken.mockReturnValue(null);
});
afterEach(() => {
  vi.clearAllMocks();
});

describe("Providers / AuthProvider", () => {
  it("starts anonymous when there is no stored token", async () => {
    render(
      <Providers>
        <Consumer />
      </Providers>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("anon"),
    );
    expect(httpGet).not.toHaveBeenCalled();
  });

  it("login() stores the token and routes home", async () => {
    const user = userEvent.setup();
    httpPost.mockResolvedValue({
      data: {
        accessToken: "jwt-123",
        user: { id: "u1", email: "me@example.com" },
      },
    });

    render(
      <Providers>
        <Consumer />
      </Providers>,
    );

    await user.click(screen.getByRole("button", { name: "login" }));

    await waitFor(() => expect(setToken).toHaveBeenCalledWith("jwt-123"));
    expect(push).toHaveBeenCalledWith("/");
    expect(screen.getByTestId("status")).toHaveTextContent("authed");
  });

  it("a qb:unauthorized event logs the user out and redirects", async () => {
    render(
      <Providers>
        <Consumer />
      </Providers>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("anon"),
    );

    act(() => {
      window.dispatchEvent(new Event("qb:unauthorized"));
    });

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
  });
});
