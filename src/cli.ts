#!/usr/bin/env bun
import { Command } from "commander";
import chalk from "chalk";
import { spawn } from "child_process";

export const program = new Command();

export interface AgentConfig {
  name: string;
  command: string;
  type: "sync" | "async";
  description: string;
}

export const agents: Record<string, AgentConfig> = {
  claude: {
    name: "Claude Code",
    command: "claude",
    type: "sync",
    description: "Anthropic's interactive coding assistant",
  },
  gemini: {
    name: "Gemini CLI",
    command: "gemini",
    type: "sync",
    description: "Google's interactive coding assistant",
  },
  jules: {
    name: "Jules",
    command: "jules",
    type: "async",
    description: "Google's asynchronous coding agent",
  },
};

program
  .name("orchestra")
  .description("Orchestrate multiple AI coding agents")
  .version("0.1.0");

// List available agents
program
  .command("agents")
  .description("List available agents and their status")
  .action(async () => {
    console.log(chalk.bold("\nAvailable Agents:\n"));

    for (const [key, agent] of Object.entries(agents)) {
      const isInstalled = await checkAgentInstalled(agent.command);
      const status = isInstalled
        ? chalk.green("✓ installed")
        : chalk.red("✗ not found");
      const typeLabel =
        agent.type === "sync"
          ? chalk.blue("[sync]")
          : chalk.yellow("[async]");

      console.log(`  ${chalk.bold(key.padEnd(10))} ${typeLabel} ${status}`);
      console.log(`  ${chalk.gray(agent.description)}\n`);
    }
  });

// Show agent versions
program
  .command("status")
  .description("Show versions of installed agents")
  .action(async () => {
    console.log(chalk.bold("\nAgent Status:\n"));

    for (const [key, agent] of Object.entries(agents)) {
      let versionStr = chalk.gray("checking...");
      const versionArg = key === "jules" ? "version" : "--version";

      try {
        const proc = Bun.spawn([agent.command, versionArg], {
          stdout: "pipe",
          stderr: "pipe",
        });

        const output = await new Response(proc.stdout).text();
        await proc.exited;

        if (proc.exitCode === 0) {
          const cleanVersion = output.trim().split("\n")[0];
          versionStr = chalk.green(cleanVersion || "installed");
        } else {
          versionStr = chalk.red("not found or error");
        }
      } catch {
        versionStr = chalk.red("not found");
      }

      console.log(`  ${chalk.bold(key.padEnd(10))} ${versionStr}`);
    }
    console.log();
  });

// Run a task with a specific agent
program
  .command("run")
  .description("Run a task with a specific agent")
  .argument("<agent>", "Agent to use (claude, gemini, jules)")
  .argument("<task>", "Task description")
  .option("-y, --yolo", "Auto-approve all actions (gemini only)")
  .option("-r, --repo <repo>", "GitHub repo for Jules (owner/repo)")
  .option("-p, --parallel <n>", "Number of parallel Jules sessions", "1")
  .action(async (agentName: string, task: string, options) => {
    const agent = agents[agentName];
    if (!agent) {
      console.error(chalk.red(`Unknown agent: ${agentName}`));
      console.log(`Available: ${Object.keys(agents).join(", ")}`);
      process.exit(1);
    }

    console.log(
      chalk.bold(`\nDelegating to ${agent.name}...\n`)
    );

    switch (agentName) {
      case "claude":
        await runClaude(task);
        break;
      case "gemini":
        await runGemini(task, options.yolo);
        break;
      case "jules":
        await runJules(task, options.repo, parseInt(options.parallel));
        break;
    }
  });

// Dispatch task to multiple agents
program
  .command("dispatch")
  .description("Dispatch tasks to multiple agents based on task type")
  .argument("<task>", "Task description")
  .option("--sync <agent>", "Agent for synchronous work", "gemini")
  .option("--async <agent>", "Agent for asynchronous work", "jules")
  .option("-r, --repo <repo>", "GitHub repo for async tasks")
  .action(async (task: string, options) => {
    console.log(chalk.bold("\nAnalyzing task for dispatch...\n"));

    // Simple heuristic: async keywords suggest Jules
    const asyncKeywords = [
      "background",
      "later",
      "batch",
      "multiple",
      "parallel",
      "tests",
      "documentation",
    ];
    const isAsync = asyncKeywords.some((kw) =>
      task.toLowerCase().includes(kw)
    );

    if (isAsync && options.repo) {
      console.log(chalk.yellow(`Dispatching to Jules (async)...`));
      await runJules(task, options.repo, 1);
    } else {
      console.log(chalk.blue(`Dispatching to ${options.sync} (sync)...`));
      if (options.sync === "gemini") {
        await runGemini(task, false);
      } else {
        await runClaude(task);
      }
    }
  });

// Check Jules sessions
program
  .command("sessions")
  .description("List and manage Jules sessions")
  .option("-l, --list", "List all sessions")
  .option("-p, --pull <id>", "Pull a session's results")
  .option("-a, --apply", "Apply the patch when pulling")
  .action(async (options) => {
    if (options.pull) {
      const args = ["remote", "pull", "--session", options.pull];
      if (options.apply) args.push("--apply");
      await runCommand("jules", args);
    } else {
      await runCommand("jules", ["remote", "list", "--session"]);
    }
  });

// Exported for testing
export const bunUtils = {
  spawn: Bun.spawn,
};

// Helper functions
export async function checkAgentInstalled(command: string): Promise<boolean> {
  try {
    const proc = bunUtils.spawn(["which", command], { stdout: "pipe" });
    await proc.exited;
    return proc.exitCode === 0;
  } catch {
    return false;
  }
}

export async function runClaude(task: string): Promise<void> {
  console.log(chalk.gray(`Running: claude -p "${task}"`));
  await runCommand("claude", ["-p", task]);
}

export async function runGemini(task: string, yolo: boolean): Promise<void> {
  const args = yolo ? ["-y", task] : [task];
  console.log(chalk.gray(`Running: gemini ${args.join(" ")}`));
  await runCommand("gemini", args);
}

export async function runJules(
  task: string,
  repo: string | undefined,
  parallel: number
): Promise<void> {
  const args = ["new"];
  if (repo) args.push("--repo", repo);
  if (parallel > 1) args.push("--parallel", parallel.toString());
  args.push(task);

  console.log(chalk.gray(`Running: jules ${args.join(" ")}`));
  await runCommand("jules", args);
}

export async function runCommand(cmd: string, args: string[]): Promise<void> {
  const proc = spawn(cmd, args, {
    stdio: "inherit",
    shell: true,
  });

  return new Promise((resolve, reject) => {
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Command exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}

if (process.env.NODE_ENV !== "test") {
  program.parse();
}
