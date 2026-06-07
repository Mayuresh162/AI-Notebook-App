import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";

Object.assign(globalThis, {
  TextDecoder,
  TextEncoder,
});

if (!globalThis.Response) {
  Object.assign(globalThis, {
    Response: class TestResponse {
      body: unknown;
      ok: boolean;
      status: number;

      constructor(body: unknown, init?: ResponseInit) {
        this.body = body;
        this.status = init?.status || 200;
        this.ok = this.status >= 200 && this.status < 300;
      }

      static json(body: unknown, init?: ResponseInit) {
        return new TestResponse(body, init);
      }

      async json() {
        return this.body;
      }
    },
  });
}

if (!globalThis.fetch) {
  Object.assign(globalThis, {
    fetch: jest.fn(),
  });
}
