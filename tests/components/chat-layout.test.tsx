import userEvent from "@testing-library/user-event";
import { act, screen, waitFor } from "@testing-library/react";
import ChatLayout from "@/components/ChatLayout";
import { renderWithIntl } from "./test-utils";
import { readChatSseStream } from "@/lib/chat/sse-client";

const invalidateQueries = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: {
      messages: [],
      nextCursor: null,
    },
  }),
  useQueryClient: () => ({
    invalidateQueries,
  }),
}));

jest.mock("@/lib/api/auth-client", () => ({
  getAuthorizedRequestConfig: jest.fn().mockResolvedValue({
    headers: {
      Authorization: "Bearer token",
    },
  }),
}));

jest.mock("@/lib/api/thread-client", () => ({
  fetchThreadMessages: jest.fn(),
}));

jest.mock("@/lib/tools/memory", () => ({
  getMemory: () => [],
}));

jest.mock("@/lib/chat/sse-client", () => ({
  readChatSseStream: jest.fn(),
}));

describe("ChatLayout", () => {
  beforeEach(() => {
    invalidateQueries.mockClear();
    (Element.prototype.scrollIntoView as jest.Mock).mockClear();
    jest.useFakeTimers();
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      return window.setTimeout(() => callback(performance.now()), 0);
    });
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      window.clearTimeout(id);
    });
    global.fetch = jest.fn().mockResolvedValue(new Response(null));
    (readChatSseStream as jest.Mock).mockImplementation(async (_response, onEvent) => {
      onEvent({ type: "status", status: "streaming" });
      onEvent({ type: "token", text: "Hello" });
      onEvent({ type: "done" });
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("does not make the empty no-thread state scrollable", () => {
    renderWithIntl(
      <ChatLayout
        activeThreadId={null}
        onThreadUpdated={jest.fn()}
      />,
    );

    expect(screen.getByTestId("chat-scroll-area")).toHaveClass("overflow-hidden");
    expect(screen.getByText("Create a chat to start.")).toBeVisible();
  });

  it("does not make an empty active thread scrollable", () => {
    renderWithIntl(
      <ChatLayout
        activeThreadId="thread-1"
        onThreadUpdated={jest.fn()}
      />,
    );

    expect(screen.getByTestId("chat-scroll-area")).toHaveClass("overflow-hidden");
    expect(screen.getByText("Ask a question to start this chat.")).toBeVisible();
  });

  it("keeps streamed messages local instead of refreshing the active chat after completion", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    renderWithIntl(
      <ChatLayout
        activeThreadId="thread-1"
        onThreadUpdated={jest.fn()}
      />,
    );

    await user.type(
      screen.getByRole("textbox", {
        name: "Ask a question about your sources",
      }),
      "Summarize this source",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    act(() => {
      jest.runOnlyPendingTimers();
    });

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeVisible();
    });

    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("scrolls while the assistant response is streaming", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    renderWithIntl(
      <ChatLayout
        activeThreadId="thread-1"
        onThreadUpdated={jest.fn()}
      />,
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });
    (Element.prototype.scrollIntoView as jest.Mock).mockClear();

    await user.type(
      screen.getByRole("textbox", {
        name: "Ask a question about your sources",
      }),
      "Summarize this source",
    );
    await user.click(screen.getByRole("button", { name: "Send message" }));

    act(() => {
      jest.runOnlyPendingTimers();
    });

    await waitFor(() => {
      expect(screen.getByText("Hello")).toBeVisible();
    });

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
