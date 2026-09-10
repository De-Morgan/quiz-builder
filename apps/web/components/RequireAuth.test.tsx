import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
let status: "loading" | "authed" | "anon" = "loading";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));
vi.mock("@/app/providers", () => ({
  useAuth: () => ({ status }),
}));

import { RequireAuth } from "./RequireAuth";

afterEach(() => {
  replace.mockClear();
});

describe("RequireAuth", () => {
  it("renders children once authed", () => {
    status = "authed";
    render(
      <RequireAuth>
        <p>secret</p>
      </RequireAuth>,
    );
    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects an anonymous visitor to /login", () => {
    status = "anon";
    render(
      <RequireAuth>
        <p>secret</p>
      </RequireAuth>,
    );
    expect(screen.queryByText("secret")).toBeNull();
    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("shows a busy skeleton while loading", () => {
    status = "loading";
    const { container } = render(
      <RequireAuth>
        <p>secret</p>
      </RequireAuth>,
    );
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.queryByText("secret")).toBeNull();
  });
});
