# Sequa MCP

**Self Maintaining Docs for Devs & AI** — Turn your codebase into always-current documentation, so engineers and AI never read outdated docs again.

This repository is the **entry point for using Sequa via the Model Context Protocol (MCP)**. Add Sequa as an MCP server to Cursor, Claude, Windsurf, VSCode, Cline, Highlight, Augment, or any other MCP‑capable client.

---

## 🤔 What is Sequa?

70% of docs are never updated as underlying facts change, and 30% of dev time is lost searching, handling interruptions, and reworking. Documentation drifts out of sync, knowledge gets scattered across tools, and experts repeat themselves. The result: onboarding slows, context is lost, and teams waste time chasing answers instead of building.

**Sequa fixes this.** It's a Contextual Knowledge Engine that:

* **Generates docs that stay accurate** — architecture overviews, API docs, runbooks, onboarding guides
* **Continuously updates from your code** — eliminating stale pages and manual upkeep
* **Unifies knowledge across repositories** — no more hunting across Confluence, Slack, and GitHub
* **Powers your team and AI agents** — ask in plain language, get current answers with source links

### Why use Sequa MCP?

Stop stitching context for Copilot and Cursor. With Sequa MCP, your AI tools know your entire codebase and docs out of the box.

Sequa gives your AI assistants deep, real-time knowledge of your codebase, docs, tickets, and internal standards. Instead of writing code you have to fix, they write code that fits — first try.

---

## 🧱 Prerequisites

Before you configure *any* AI agent:

1. **Create / sign in to your Sequa account** at **[https://app.sequa.ai/login](https://app.sequa.ai/login?ref=sequa-mcp)**
2. **Setup a Project** inside the Sequa app
3. Inside that project, locate the **MCP Setup URLs** and select the transport your AI agent supports
4. **Copy the URL or configuration** and install it in your client

> ❗ *If you skip project creation the MCP server will refuse connections — the proxy can launch but you will receive auth / project errors.*

---

## 🚀 Quick Start (Proxy Launch)

### NPX (most common)

```bash
npx -y @sequa-ai/sequa-mcp@latest https://mcp.sequa.ai/v1/setup-code-assistant
```

> Replace the URL if you use an endpoint from the specific project

---

## 🔌 IDE / Tool Configuration

### Cursor (`~/.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "sequa": {
      "url": "https://mcp.sequa.ai/v1/setup-code-assistant"
    }
  }
}
```

### Claude Desktop (Settings → Developer → *Edit Config*)

```json
{
  "mcpServers": {
    "sequa": {
      "command": "npx",
      "args": [
        "-y",
        "@sequa-ai/sequa-mcp@latest",
        "https://mcp.sequa.ai/v1/setup-code-assistant"
      ]
    }
  }
}
```

### Windsurf (`~/.codeium/windsurf/mcp_config.json`)

```json
{
  "mcpServers": {
    "sequa": {
      "command": "npx",
      "args": [
        "-y",
        "@sequa-ai/sequa-mcp@latest",
        "https://mcp.sequa.ai/v1/setup-code-assistant"
      ]
    }
  }
}
```

### VS Code (`.vscode/mcp.json`)

```json
{
  "servers": {
    "sequa": {
      "command": "npx",
      "args": [
        "-y",
        "@sequa-ai/sequa-mcp@latest",
        "https://mcp.sequa.ai/v1/setup-code-assistant"
      ]
    }
  }
}
```

### Cline / Claude Dev Tools (`cline_mcp_settings.json`)

```json
{
  "mcpServers": {
    "sequa": {
      "command": "npx",
      "args": [
        "-y",
        "@sequa-ai/sequa-mcp@latest",
        "https://mcp.sequa.ai/v1/setup-code-assistant"
      ],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Highlight AI (GUI → Plugins → Custom Plugin → *Add using a command*)

```bash
npx -y @sequa-ai/sequa-mcp@latest https://mcp.sequa.ai/v1/setup-code-assistant
```

### Augment Code

```bash
npx -y @sequa-ai/sequa-mcp@latest https://mcp.sequa.ai/v1/setup-code-assistant
```

Or `augment_config.json`:

```json
{
  "mcpServers": {
    "sequa": {
      "command": "npx",
      "args": [
        "-y",
        "@sequa-ai/sequa-mcp@latest",
        "https://mcp.sequa.ai/v1/setup-code-assistant"
      ]
    }
  }
}
```

