import { createRef } from "react";
import { screen } from "@testing-library/react";
import ChatMessages from "@/components/ChatMessages";
import { renderWithIntl } from "./test-utils";

describe("ChatMessages", () => {
  it("renders valid messages even if a stale streaming slot is empty", () => {
    renderWithIntl(
      <ChatMessages
        messages={[
          {
            id: "user-1",
            role: "user",
            content: "What is in this source?",
          },
          undefined,
          {
            id: "assistant-1",
            role: "assistant",
            content: "Here is the answer.",
          },
        ] as never}
        scrollContainerRef={createRef<HTMLDivElement>()}
      />,
    );

    expect(screen.getByText("What is in this source?")).toBeVisible();
    expect(screen.getByText("Here is the answer.")).toBeVisible();
  });
});
