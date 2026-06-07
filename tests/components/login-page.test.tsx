import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import LoginPage from "@/app/login/page";
import { renderWithIntl } from "./test-utils";

const signInWithOtp = jest.fn();
const signInWithOAuth = jest.fn();

jest.mock("@/lib/supabase-client", () => ({
  getSupabaseClient: () => ({
    auth: {
      signInWithOAuth,
      signInWithOtp,
    },
  }),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    signInWithOtp.mockResolvedValue({ error: null });
    signInWithOAuth.mockResolvedValue({ error: null });
  });

  it("renders accessible sign-in controls", () => {
    renderWithIntl(<LoginPage />);

    expect(screen.getByRole("heading", { name: "Sign in" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "you@example.com" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Send magic link" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Continue with GitHub" })).toBeVisible();
  });

  it("shows an email validation error before sending a magic link", async () => {
    const user = userEvent.setup();

    renderWithIntl(<LoginPage />);

    await user.click(screen.getByRole("button", { name: "Send magic link" }));

    expect(screen.getByText("Enter your email address.")).toBeVisible();
    expect(signInWithOtp).not.toHaveBeenCalled();
  });
});
