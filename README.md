# Sequa MCP

This repository is the **entry point for using Sequa via the Model Context Protocol (MCP)**. If you arrived here looking to "add Sequa as an MCP server" to Cursor, Claude, Windsurf, VSCode, Cline, Highlight, Augment, or any other MCP‑capable client — you are in the right place.

It gives you a **single drop‑in command** that bridges *STDIO/command* MCP transports used by many IDEs today with Sequa’s **native streamable HTTP MCP** endpoint.

---

## 🧱 Prerequisites (Read First!)

Before you configure *any* AI agent:

1. **Create / sign in to your Sequa account** at **[https://app.sequa.ai/login](https://app.sequa.ai/login)**.
2. **Setup a Project** inside the Sequa app.
3. Inside that project, locate the **MCP Setup URLs** and select the transport your AI agent supports.

> ❗ *If you skip project creation the MCP server will refuse connections — the proxy can launch but you will receive auth / project errors.*

---

## 🤔 What is Sequa?

Sequa is a **Contextual Knowledge Engine** that unifies code, documentation, tickets and more across *multiple* repositories and continuously streams that context to any LLM‑powered agent. By injecting deep, current project knowledge, Sequa enables assistants to:

* Understand architecture & cross‑repo tasks
* Generate more accurate / cohesive code
* Reduce hallucinations & redundant exploration

---

## 🚀 Quick Start (Proxy Launch)

### NPX (most common)

```bash
npx -y @sequa-ai/sequa-mcp@latest https://mcp.sequa.ai/v1/setup-code-assistant
```

> Replace the URL if you use an endpoint from the specific project

---

## 🔌 IDE / Tool Configuration

> **Always use the `command` + `args` configuration until your client adds native HTTP transport.** Replace `<endpoint>` below with **either** `v1/setup-code-assistant` (preferred) **or** `v1/setup-code-assistant/sse`.

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

