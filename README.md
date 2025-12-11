# Agent Orchestra

A CLI tool to orchestrate multiple AI coding agents (Claude Code, Gemini CLI, Jules).

## Installation

```bash
bun install
bun run build
```

## Usage

### List available agents
```bash
orchestra agents
```

### Run a task with a specific agent
```bash
# Interactive with Gemini
orchestra run gemini "implement a binary search function"

# Auto-approve with Gemini (YOLO mode)
orchestra run gemini "add input validation" -y

# Async with Jules
orchestra run jules "write unit tests" --repo owner/repo

# Parallel Jules sessions
orchestra run jules "add error handling" --repo owner/repo -p 3
```

### Smart dispatch
```bash
# Automatically routes to sync or async agent
orchestra dispatch "write comprehensive tests" --repo owner/repo
```

### Manage Jules sessions
```bash
# List sessions
orchestra sessions -l

# Pull results
orchestra sessions -p <session-id>

# Pull and apply patch
orchestra sessions -p <session-id> -a
```

## Agent Characteristics

| Agent | Type | Best For |
|-------|------|----------|
| Claude Code | Sync | Complex reasoning, architecture decisions |
| Gemini CLI | Sync | Fast iteration, code generation |
| Jules | Async | Background tasks, tests, docs, batch work |

## License

MIT
