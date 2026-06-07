import userEvent from "@testing-library/user-event";
import { screen } from "@testing-library/react";
import ChatInput from "@/components/ChatInput";
import { renderWithIntl } from "./test-utils";

describe("ChatInput", () => {
  it("submits typed questions and clears the input", async () => {
    const user = userEvent.setup();
    const ask = jest.fn().mockResolvedValue(undefined);

    renderWithIntl(<ChatInput ask={ask} />);

    const input = screen.getByRole("textbox", {
      name: "Ask a question about your sources",
    });

    await user.type(input, "Summarize this");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(ask).toHaveBeenCalledWith("Summarize this");
    expect(input).toHaveValue("");
  });

  it("disables submit while loading", () => {
    renderWithIntl(<ChatInput ask={jest.fn()} loading />);

    expect(screen.getByRole("button", { name: "Sending message" })).toBeDisabled();
  });
});
