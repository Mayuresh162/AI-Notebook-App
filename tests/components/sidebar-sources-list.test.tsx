import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { SidebarSourcesList } from "@/components/sidebar/SidebarSourcesList";
import { renderWithIntl } from "./test-utils";

describe("SidebarSourcesList", () => {
  it("uses checkbox semantics for source selection", async () => {
    const user = userEvent.setup();
    const onToggleSource = jest.fn();

    renderWithIntl(
      <SidebarSourcesList
        sources={[{ name: "Guide.pdf", source: "pdf" }]}
        selectedSources={[]}
        onRemoveSource={jest.fn()}
        onToggleSource={onToggleSource}
      />,
    );

    const checkbox = screen.getByRole("checkbox", {
      name: "Select source: Guide.pdf",
    });

    expect(checkbox).toHaveAttribute("aria-checked", "false");

    await user.click(checkbox);

    expect(onToggleSource).toHaveBeenCalledWith("Guide.pdf");
  });
});
