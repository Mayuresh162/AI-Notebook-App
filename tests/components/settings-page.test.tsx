import userEvent from "@testing-library/user-event";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import SettingsPage from "@/components/settings/SettingsPage";
import { renderWithIntl } from "./test-utils";
import {
  getAuthorizedRequestConfig,
  signOutAndRedirect,
} from "@/lib/api/auth-client";
import {
  connectGoogleDrive,
  connectNotion,
  syncConnectedSources,
} from "@/lib/api/source-client";

const replace = jest.fn();
const setTheme = jest.fn();
const getUser = jest.fn();
const updateUser = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
  }),
}));

jest.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    setTheme,
  }),
}));

jest.mock("sonner", () => ({
  toast: {
    loading: jest.fn(() => "toast-id"),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock("@/lib/supabase-client", () => ({
  getSupabaseClient: () => ({
    auth: {
      getUser,
      updateUser,
    },
  }),
}));

jest.mock("@/lib/api/auth-client", () => ({
  getAuthorizedRequestConfig: jest.fn(),
  signOutAndRedirect: jest.fn(),
}));

jest.mock("@/lib/api/source-client", () => ({
  connectGoogleDrive: jest.fn(),
  connectNotion: jest.fn(),
  syncConnectedSources: jest.fn(),
}));

describe("SettingsPage", () => {
  beforeEach(() => {
    replace.mockClear();
    setTheme.mockClear();
    getUser.mockResolvedValue({
      data: {
        user: {
          email: "mayuresh@example.com",
          user_metadata: {
            full_name: "Mayuresh Bhagat",
          },
        },
      },
    });
    updateUser.mockResolvedValue({
      error: null,
    });
    (getAuthorizedRequestConfig as jest.Mock).mockResolvedValue({
      headers: {
        Authorization: "Bearer token",
      },
    });
    (connectGoogleDrive as jest.Mock).mockClear();
    (connectNotion as jest.Mock).mockClear();
    (syncConnectedSources as jest.Mock).mockResolvedValue(undefined);
    (signOutAndRedirect as jest.Mock).mockClear();
  });

  it("renders settings tabs and disables profile save until changed", async () => {
    renderWithIntl(<SettingsPage />);

    expect(screen.getByRole("tab", { name: /profile/i })).toBeVisible();
    expect(screen.getByRole("tab", { name: /appearance/i })).toBeVisible();
    expect(screen.getByRole("tab", { name: /integrations/i })).toBeVisible();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeVisible();

    await waitFor(() => {
      expect(screen.getByLabelText("Display name")).toHaveValue(
        "Mayuresh Bhagat",
      );
    });

    expect(screen.getByRole("button", { name: "Save profile" })).toBeDisabled();
  });

  it("signs out from settings", async () => {
    const user = userEvent.setup();

    renderWithIntl(<SettingsPage />);

    await user.click(screen.getByRole("button", { name: "Sign out" }));

    expect(signOutAndRedirect).toHaveBeenCalledTimes(1);
  });

  it("updates the Supabase auth profile display name", async () => {
    renderWithIntl(<SettingsPage />);

    const input = await screen.findByLabelText("Display name");

    await waitFor(() => {
      expect(input).toHaveValue("Mayuresh Bhagat");
    });

    fireEvent.change(input, {
      target: {
        value: "Mayuresh",
      },
    });

    fireEvent.submit(screen.getByRole("form", { name: "Profile settings" }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith({
        data: {
          full_name: "Mayuresh",
        },
      });
    });
  });

  it("switches between dark, light, and system themes", async () => {
    const user = userEvent.setup();

    renderWithIntl(<SettingsPage />);

    await user.click(screen.getByRole("tab", { name: /appearance/i }));
    await user.click(screen.getByRole("button", { name: "Light" }));
    await user.click(screen.getByRole("button", { name: "Dark" }));
    await user.click(screen.getByRole("button", { name: "System" }));

    expect(setTheme).toHaveBeenCalledWith("light");
    expect(setTheme).toHaveBeenCalledWith("dark");
    expect(setTheme).toHaveBeenCalledWith("system");
  });

  it("runs integration connect and sync actions", async () => {
    const user = userEvent.setup();

    renderWithIntl(<SettingsPage />);

    await user.click(screen.getByRole("tab", { name: /integrations/i }));
    await user.click(screen.getByRole("button", { name: "Google Drive" }));
    await user.click(screen.getByRole("button", { name: "Notion" }));
    await user.click(screen.getByRole("button", { name: "Sync Connected Apps" }));

    expect(connectGoogleDrive).toHaveBeenCalledTimes(1);
    expect(connectNotion).toHaveBeenCalledTimes(1);
    expect(syncConnectedSources).toHaveBeenCalledWith({
      headers: {
        Authorization: "Bearer token",
      },
    });
  });
});
