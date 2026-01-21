# MCP Image Scraper

An MCP server for authenticated image scraping from Savee, Pinterest, and Shotdeck.

## Setup

1. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your login credentials for each platform

3. Add to your Claude Code MCP settings (`~/.claude.json`):
   ```json
   {
     "mcpServers": {
       "image-scraper": {
         "command": "node",
         "args": ["/Users/martinfrancis/scene-it/mcp-image-scraper/index.js"],
         "env": {
           "SAVEE_EMAIL": "your-email",
           "SAVEE_PASSWORD": "your-password",
           "PINTEREST_EMAIL": "your-email",
           "PINTEREST_PASSWORD": "your-password",
           "SHOTDECK_EMAIL": "your-email",
           "SHOTDECK_PASSWORD": "your-password"
         }
       }
     }
   }
   ```

## Available Tools

- `search_savee` - Search Savee.it for images
- `search_pinterest` - Search Pinterest for images
- `search_shotdeck` - Search Shotdeck for film stills

## Usage

Once configured, you can use these tools in Claude Code:
- "Search Savee for minimalist architecture"
- "Find Pinterest images of warm interiors"
- "Search Shotdeck for moody lighting"
