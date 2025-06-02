# Sequa MCP

A proxy for the Model Context Protocol (MCP) that connects local STDIO with remote MCP servers.

## Usage with npx

```bash
npx @sequa-ai/sequa-mcp@latest https://your-server-url.com
```

```json
{
  "mcpServers": {
    "sequa-mcp": {
      "command": "npx",
      "args": [
        "-y",
        "@sequa-ai/sequa-mcp@latest",
        "https://your-server-url.com"
      ]
    }
  }
}
```

### Usage with Docker

```bash
docker run -i --rm --network host sequa/sequa-mcp:latest https://your-server-url.com
```

```json
{
  "mcpServers": {
    "sequa-mcp": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--network",
        "host",
        "sequa/sequa-mcp:latest",
        "https://your-server-url.com"
      ]
    }
  }
}
```
