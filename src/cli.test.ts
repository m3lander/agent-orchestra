import { vi, test, expect, describe, beforeEach, mock } from "bun:test";
import * as cli from "./cli";
import { spawn } from "child_process";

// Mock for child_process is preloaded
const spawnMock = spawn as mock;

describe("Orchestra CLI", () => {
  let bunSpawnMock: mock;

  beforeEach(() => {
    vi.restoreAllMocks();
    spawnMock.mockClear();

    // Create a fresh mock for each test
    bunSpawnMock = mock(() => ({
      exited: Promise.resolve(),
      exitCode: 0,
    }));
    vi.spyOn(cli.bunUtils, "spawn").mockImplementation(bunSpawnMock);
  });

  describe("Helper Functions", () => {
    test("checkAgentInstalled should return true if command exists", async () => {
      bunSpawnMock.mockReturnValueOnce({
        exited: Promise.resolve(),
        exitCode: 0,
      });
      const result = await cli.checkAgentInstalled("claude");
      expect(result).toBe(true);
      expect(bunSpawnMock).toHaveBeenCalledWith(["which", "claude"], {
        stdout: "pipe",
      });
    });

    test("checkAgentInstalled should return false if command does not exist", async () => {
      bunSpawnMock.mockReturnValueOnce({
        exited: Promise.resolve(),
        exitCode: 1,
      });
      const result = await cli.checkAgentInstalled("unknown-agent");
      expect(result).toBe(false);
    });

    test("runCommand should call spawn with correct arguments", async () => {
      await cli.runCommand("test-cmd", ["arg1", "arg2"]);
      expect(spawnMock).toHaveBeenCalledWith(
        "test-cmd",
        ["arg1", "arg2"],
        {
          stdio: "inherit",
          shell: true,
        }
      );
    });

    test("runClaude should call runCommand with correct arguments", async () => {
      const runCommandSpy = vi
        .spyOn(cli, "runCommand")
        .mockImplementation(async () => {});
      await cli.runClaude("test task");
      expect(runCommandSpy).toHaveBeenCalledWith("claude", ["-p", "test task"]);
    });

    test("runGemini should call runCommand with correct arguments", async () => {
      const runCommandSpy = vi
        .spyOn(cli, "runCommand")
        .mockImplementation(async () => {});
      await cli.runGemini("test task", false);
      expect(runCommandSpy).toHaveBeenCalledWith("gemini", ["test task"]);
    });

    test("runGemini should call runCommand with yolo flag", async () => {
      const runCommandSpy = vi
        .spyOn(cli, "runCommand")
        .mockImplementation(async () => {});
      await cli.runGemini("test task", true);
      expect(runCommandSpy).toHaveBeenCalledWith("gemini", ["-y", "test task"]);
    });

    test("runJules should call runCommand with correct arguments", async () => {
      const runCommandSpy = vi
        .spyOn(cli, "runCommand")
        .mockImplementation(async () => {});
      await cli.runJules("test task", "owner/repo", 2);
      expect(runCommandSpy).toHaveBeenCalledWith("jules", [
        "new",
        "--repo",
        "owner/repo",
        "--parallel",
        "2",
        "test task",
      ]);
    });
  });

  describe("CLI Commands", () => {
    test("agents command should list agents and their status", async () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      // Directly call the action to isolate it
      const agentsCommand = cli.program.commands.find(
        (c) => c.name() === "agents"
      );
      await agentsCommand._actionHandler([], {});

      const output = consoleLogSpy.mock.calls.join("\\n");
      expect(output).toContain("Available Agents");
      expect(output).toContain("claude");
      expect(output).toContain("gemini");
      expect(output).toContain("jules");
    });

    test("run command should delegate to the correct agent", async () => {
      const runClaudeSpy = vi
        .spyOn(cli, "runClaude")
        .mockImplementation(async () => {});
      const runGeminiSpy = vi
        .spyOn(cli, "runGemini")
        .mockImplementation(async () => {});
      const runJulesSpy = vi
        .spyOn(cli, "runJules")
        .mockImplementation(async () => {});

      await cli.program.parseAsync(["run", "claude", "test task"], {
        from: "user",
      });
      expect(runClaudeSpy).toHaveBeenCalledWith("test task");

      await cli.program.parseAsync(["run", "gemini", "test task", "-y"], {
        from: "user",
      });
      expect(runGeminiSpy).toHaveBeenCalledWith("test task", true);

      await cli.program.parseAsync(
        ["run", "jules", "test task", "-r", "owner/repo", "-p", "3"],
        { from: "user" }
      );
      expect(runJulesSpy).toHaveBeenCalledWith("test task", "owner/repo", 3);
    });

    test("dispatch command should route to sync agent", async () => {
      const runGeminiSpy = vi
        .spyOn(cli, "runGemini")
        .mockImplementation(async () => {});
      await cli.program.parseAsync(["dispatch", "fix this bug"], {
        from: "user",
      });
      expect(runGeminiSpy).toHaveBeenCalledWith("fix this bug", false);
    });

    test("dispatch command should route to async agent for keywords", async () => {
      const runJulesSpy = vi
        .spyOn(cli, "runJules")
        .mockImplementation(async () => {});
      await cli.program.parseAsync(
        ["dispatch", "add tests for this feature", "-r", "owner/repo"],
        { from: "user" }
      );
      expect(runJulesSpy).toHaveBeenCalledWith(
        "add tests for this feature",
        "owner/repo",
        1
      );
    });

    test("sessions command should list sessions", async () => {
      const runCommandSpy = vi
        .spyOn(cli, "runCommand")
        .mockImplementation(async () => {});
      await cli.program.parseAsync(["sessions", "--list"], { from: "user" });
      expect(runCommandSpy).toHaveBeenCalledWith("jules", [
        "remote",
        "list",
        "--session",
      ]);
    });

    test("sessions command should pull a session", async () => {
      const runCommandSpy = vi
        .spyOn(cli, "runCommand")
        .mockImplementation(async () => {});
      await cli.program.parseAsync(["sessions", "--pull", "123"], {
        from: "user",
      });
      expect(runCommandSpy).toHaveBeenCalledWith("jules", [
        "remote",
        "pull",
        "--session",
        "123",
      ]);
    });

    test("sessions command should pull and apply a session", async () => {
      const runCommandSpy = vi
        .spyOn(cli, "runCommand")
        .mockImplementation(async () => {});
      await cli.program.parseAsync(
        ["sessions", "--pull", "123", "--apply"],
        { from: "user" }
      );
      expect(runCommandSpy).toHaveBeenCalledWith("jules", [
        "remote",
        "pull",
        "--session",
        "123",
        "--apply",
      ]);
    });
  });
});
