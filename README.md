# Sequa MCP

> **The missing brain for your AI dev tools**

## 🤔 What is Sequa?

Sequa is a **Contextual Knowledge Engine** that unifies code, documentation and tickets across *multiple* repositories and streams that live context to any LLM‑powered assistant. By giving tools like Cursor or Claude deep, always‑current project knowledge, Sequa helps them answer architecture‑level questions, generate more accurate code and slash hallucinations.

## 🖥️ What is Sequa MCP?

`sequa‑mcp` is a tiny proxy that lets any **STDIO‑based** AI client talk to your Sequa workspace using the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction). It forwards STDIO traffic to Sequa’s **streamable HTTP MCP endpoint** - so IDEs that only support the *command* transport can connect with **zero extra infrastructure**.

### Why not just use a URL?

Most IDEs currently speak MCP over STDIO **commands** and assume the proxy is responsible for networking. Sequa exposes an advanced bidirectional HTTP stream, not SSE, so direct `url:` configs will not work *yet*. Until IDEs add first‑class support, always configure Sequa through the **command/args** option shown below.

## 🚀 Quick Start

### Via NPX

```bash
npx -y @sequa-ai/sequa-mcp@latest  https://mcp.sequa.ai/<endpoint>
```

### Via Docker

```bash
docker run -i --rm --network host sequa/sequa-mcp:latest  https://mcp.sequa.ai/<endpoint>
```

---

## 🔌 Connect Your Favourite Tools

> Replace ` https://mcp.sequa.ai/<endpoint>` with your actual Sequa MCP URL. **Always** use the `command` style until IDEs support HTTP‑stream URLs directly.

### Cursor

`~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "sequa": {
      "command": "npx",
      "args": [
        "-y",
        "@sequa-ai/sequa-mcp@latest",
        " https://mcp.sequa.ai/<endpoint>"
      ]
    }
  }
}
```

### Claude Desktop

Settings ➜ Developer ➜ **Edit Config**

```json
{
  "mcpServers": {
    "sequa": {
      "command": "npx",
      "args": [
        "-y",
        "@sequa-ai/sequa-mcp@latest",
        "https://mcp.sequa.ai/<endpoint>"
      ]
    }
  }
}
```

### Windsurf

`~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "sequa": {
      "command": "npx",
      "args": [
        "-y",
        "@sequa-ai/sequa-mcp@latest",
        "https://mcp.sequa.ai/<endpoint>"
      ]
    }
  }
}
```

### VS Code

`.vscode/mcp.json`

```json
{
  "servers": {
    "sequa": {
      "command": "npx",
      "args": [
        "-y",
        "@sequa-ai/sequa-mcp@latest",
        "https://mcp.sequa.ai/<endpoint>"
      ]
    }
  }
}
```

### Cline (Claude Dev‑Tools)

`~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

```json
{
  "mcpServers": {
    "sequa": {
      "command": "npx",
      "args": [
        "-y",
        "@sequa-ai/sequa-mcp@latest",
        "https://mcp.sequa.ai/<endpoint>"
      ],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### Highlight AI

1. Click the plugins icon (@) ➜ **Installed Plugins** ➜ **Custom Plugin** ➜ **Add using a command**
2. Use:

   ```bash
   npx -y @sequa-ai/sequa-mcp@latest https://mcp.sequa.ai/<endpoint>
   ```

### Augment Code

```bash
npx @sequa-ai/sequa-mcp@latest https://mcp.sequa.ai/<endpoint>
```

Or in `augment_config.json`:

```json
{
  "mcpServers": {
    "sequa": {
      "command": "npx",
      "args": [
        "-y",
        "@sequa-ai/sequa-mcp@latest",
        "https://mcp.sequa.ai/<endpoint>"
      ]
    }
  }
}
```

---

## ⚙️ How It Works

```text
IDE / Agent ⇄ Sequa MCP (local proxy) ⇄ Sequa Workspace (HTTP‑stream MCP)
```

1. Your IDE writes MCP requests on STDIO.
2. `sequa‑mcp` streams them over HTTPS to the Sequa workspace.
3. Sequa enriches the requests with real‑time, multi‑repo context and streams back partial results.
4. The proxy pipes the bytes straight to your IDE for instant feedback.

