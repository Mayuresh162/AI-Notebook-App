import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import UserMenu from "@/components/UserMenu";
import { renderWithIntl } from "./test-utils";
import { signOutAndRedirect } from "@/lib/api/auth-client";

jest.mock("@/lib/api/auth-client", () => ({
  signOutAndRedirect: jest.fn(),
}));

describe("UserMenu", () => {
  it("shows only settings and sign out actions", async () => {
    const user = userEvent.setup();

    renderWithIntl(<UserMenu />);

    await user.click(screen.getByRole("button", { name: "Open user menu" }));

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();
    expect(screen.queryByText("New Chat")).not.toBeInTheDocument();
    expect(screen.queryByText("Profile")).not.toBeInTheDocument();
    expect(screen.queryByText("Theme")).not.toBeInTheDocument();
  });

  it("signs out from the dropdown", async () => {
    const user = userEvent.setup();

    renderWithIntl(<UserMenu />);

    await user.click(screen.getByRole("button", { name: "Open user menu" }));
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(signOutAndRedirect).toHaveBeenCalledTimes(1);
  });

  it("closes when clicking outside the dropdown", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <div>
        <UserMenu />
        <button type="button">Outside</button>
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Open user menu" }));

    expect(screen.getByRole("link", { name: "Settings" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("link", { name: "Settings" })).not.toBeInTheDocument();
  });
});
