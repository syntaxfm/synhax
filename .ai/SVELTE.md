# Svelte MCP Rules

When connected to the svelte-llm MCP server, you have access to comprehensive
Svelte 5 and SvelteKit documentation. Here's how to use the available tools
effectively:

## Available MCP Tools

### 1. list_sections

Use this FIRST to discover all available documentation sections. Returns a
structured list with titles and paths. When asked about Svelte or SvelteKit
topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get_documentation

Retrieves full documentation content for specific sections. Accepts single or
multiple sections. After calling the list_sections tool, you MUST analyze the
returned documentation sections and then use the get_documentation tool to fetch
ALL documentation sections that are relevant for the users task.

Use PascalCase for components and snake_case for all js vars and functions.
