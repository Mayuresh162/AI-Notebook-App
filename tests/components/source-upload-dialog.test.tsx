import { useState } from "react";
import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { SourceUploadDialog } from "@/components/sidebar/SourceUploadDialog";
import { renderWithIntl } from "./test-utils";

function ControlledDialog() {
  const [mode, setMode] = useState<"link" | "text">("link");

  return (
    <SourceUploadDialog
      open
      mode={mode}
      submitting={false}
      onModeChange={setMode}
      onOpenChange={jest.fn()}
      onSubmit={jest.fn()}
    />
  );
}

describe("SourceUploadDialog", () => {
  it("renders labelled link and text fields", async () => {
    const user = userEvent.setup();

    renderWithIntl(<ControlledDialog />);

    expect(screen.getByRole("textbox", { name: "Source URL" })).toBeVisible();

    await user.click(screen.getByRole("tab", { name: /text/i }));

    expect(screen.getByRole("textbox", { name: "Source text" })).toBeVisible();
  });

  it("shows validation errors for empty submit", async () => {
    const user = userEvent.setup();

    renderWithIntl(
      <SourceUploadDialog
        open
        mode="link"
        submitting={false}
        onModeChange={jest.fn()}
        onOpenChange={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Add source" }));

    expect(screen.getByText("Enter a link to add.")).toBeVisible();
  });
});
