import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import { SidebarQuickActions } from "@/components/sidebar/SidebarQuickActions";
import { renderWithIntl } from "./test-utils";

function renderActions(onClearChats = jest.fn()) {
  renderWithIntl(
    <SidebarQuickActions
      dragActive={false}
      onAddFile={jest.fn()}
      onAddUrl={jest.fn()}
      onDragLeave={jest.fn()}
      onDragOver={jest.fn()}
      onDrop={jest.fn()}
      onPasteText={jest.fn()}
      onNewChat={jest.fn()}
      onClearChats={onClearChats}
    />,
  );

  return onClearChats;
}

describe("SidebarQuickActions", () => {
  it("requires a second click before clearing chats", async () => {
    const user = userEvent.setup();
    const onClearChats = renderActions();

    await user.click(screen.getByRole("button", { name: "Clear Chats" }));

    expect(onClearChats).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Confirm Clear Chats" }));

    expect(onClearChats).toHaveBeenCalledTimes(1);
  });
});
