import { screen } from "@testing-library/react";
import { SidebarHeader } from "@/components/sidebar/SidebarHeader";
import { renderWithIntl } from "./test-utils";

describe("SidebarHeader", () => {
  it("links to settings", () => {
    renderWithIntl(<SidebarHeader />);

    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings",
    );
  });
});
