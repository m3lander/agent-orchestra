# Agent Orchestra - Session Handoff

## Context

This project demonstrates multi-agent orchestration between Claude Code, Gemini CLI, and Jules CLI. The CLI tool (`agent-orchestra`) is functional and has passing tests.

## Repository

- **URL**: https://github.com/m3lander/agent-orchestra
- **Local**: `/Users/maxmelander/Projects/agent-orchestra`

## Current State

| Component | Status |
|-----------|--------|
| CLI scaffold | Complete |
| `agents` command | Working |
| `status` command | Working |
| `run` command | Working |
| `dispatch` command | Working |
| `sessions` command | Working |
| Unit tests | 14 passing |

## CLI Usage

```bash
cd ~/Projects/agent-orchestra

# Test the CLI
bun run dev agents      # List agents
bun run dev status      # Show versions
bun run dev --help      # Full help

# Run tests
bun test
```

## Next Session Tasks

### Phase 1: Delegate to Jules (Async Background Tasks)

Start by sending these 3 tasks to Jules to run in parallel while you work with Gemini:

```bash
# Task 1: Add error handling and retry logic
jules new "Add robust error handling to all agent runner functions (runClaude, runGemini, runJules). Include:
- Timeout handling (configurable per agent)
- Retry logic with exponential backoff
- Graceful error messages with chalk formatting
- Exit codes that reflect the underlying agent's exit code" --repo m3lander/agent-orchestra

# Task 2: Add configuration file support
jules new "Add support for a .orchestrarc.json config file that allows users to:
- Set default agents for sync/async tasks
- Configure timeout values per agent
- Set default repo for Jules tasks
- Enable/disable colored output
Look at how other CLIs (eslint, prettier) handle config files." --repo m3lander/agent-orchestra

# Task 3: Add logging and history
jules new "Add a logging system that:
- Logs all agent invocations to ~/.orchestra/history.log
- Includes timestamp, agent, task, and result status
- Add a 'history' command to view past invocations
- Add a 'replay' command to re-run a previous task" --repo m3lander/agent-orchestra
```

### Phase 2: Collaborate with Gemini (Larger Feature)

While Jules works on the above, collaborate with Gemini on adding a **Pipeline Feature**:

**Feature Description**: Add the ability to define and run multi-agent pipelines where tasks flow from one agent to another automatically.

```bash
# Start interactive session with Gemini
cd ~/Projects/agent-orchestra
gemini "I want to add a pipeline feature to this CLI. The feature should:

1. Allow defining pipelines in a YAML file like:
   pipeline:
     name: feature-dev
     steps:
       - agent: gemini
         task: 'implement the feature'
         mode: auto_edit
       - agent: claude
         task: 'review the implementation'
       - agent: jules
         task: 'write tests'
         parallel: 2

2. Add a 'pipeline run <name>' command
3. Add a 'pipeline list' command
4. Add a 'pipeline create' interactive wizard

Let's start by designing the YAML schema and the pipeline runner architecture."
```

**Gemini Collaboration Flow**:
1. Design the pipeline schema together
2. Implement the YAML parser
3. Build the pipeline runner
4. Add the CLI commands
5. Test with a real pipeline

### Phase 3: Integration

Once Jules completes its tasks:
1. Check status: `jules remote list --session`
2. Pull and review each: `jules remote pull --session <ID>`
3. Apply good ones: `jules remote pull --session <ID> --apply`
4. Run tests: `bun test`
5. Integrate with the pipeline feature from Gemini work

## Agent Strengths Reminder

| Agent | Use For |
|-------|---------|
| **Claude** | Orchestration, complex decisions, code review, integration |
| **Gemini** | Interactive design, rapid iteration, prototyping |
| **Jules** | Background tasks, tests, docs, parallel processing |

## Key Files

```
agent-orchestra/
├── src/
│   ├── cli.ts          # Main CLI entry point
│   ├── cli.test.ts     # Unit tests
│   └── tests/
│       └── setup.ts    # Test mocks
├── package.json
├── bunfig.toml         # Bun test config
└── README.md
```

## Commands Reference

```bash
# Jules
jules new "task" --repo m3lander/agent-orchestra
jules new "task" --repo m3lander/agent-orchestra --parallel 3
jules remote list --session
jules remote pull --session <ID>
jules remote pull --session <ID> --apply

# Gemini
gemini "prompt"              # Interactive
gemini -y "prompt"           # Auto-approve
gemini -s "prompt"           # Sandbox
gemini --resume latest       # Resume session

# Orchestra CLI
bun run dev agents
bun run dev status
bun run dev run gemini "task" -y
bun run dev run jules "task" -r owner/repo
bun run dev dispatch "task" -r owner/repo
bun run dev sessions -l
```

## Success Criteria

By end of next session:
- [ ] 3 Jules tasks completed and integrated
- [ ] Pipeline feature designed and implemented with Gemini
- [ ] All tests passing
- [ ] New features documented in README
- [ ] Pushed to GitHub

## Notes

- Jules sessions take a few minutes to complete - start them first
- Use `gemini -s` (sandbox) for experimental changes
- Pull Jules results before making conflicting edits
- Commit frequently to avoid merge conflicts
