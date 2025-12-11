import { mock } from "bun:test";

mock.module("child_process", () => ({
  spawn: mock(() => ({
    on: mock((event: string, cb: (code: number) => void) => {
      if (event === "close") cb(0);
    }),
  })),
}));
