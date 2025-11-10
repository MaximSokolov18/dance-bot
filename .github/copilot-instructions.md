# AI Agent Instructions for Dance Bot

## Project Overview
This is a Telegram bot built with TypeScript using the [grammY](https://grammy.dev/) framework. The bot is designed with modern ESM modules and strict TypeScript configuration.

## Architecture & Structure
- `src/` - Source code directory
  - `bot.ts` - Main bot entry point with command and event handlers
- `dist/` - Compiled JavaScript output (generated)

## Key Technologies & Dependencies
- **Runtime**: Node.js with ESM modules (`"type": "module"` in package.json)
- **Framework**: grammY v1.38+ for Telegram bot functionality
- **Language**: TypeScript with strict configuration
- **Build Tools**: TypeScript compiler (tsc)

## Development Workflow

### Commands
```bash
# Start development with live reload
npm run dev

# Watch TypeScript files only
npm run watch

# Build TypeScript files
npm run build

# Start the bot (production)
npm run start
```

### TypeScript Configuration
The project uses a strict TypeScript configuration with:
- ESM module system (`"module": "nodenext"`)
- Modern JavaScript target (`"target": "esnext"`)
- Verbatim module syntax for clear imports/exports
- Source maps and declaration files enabled
- Strict type checking and other safety features

See `tsconfig.json` for detailed compiler options.

## Bot Structure Patterns
1. Command handlers use the pattern:
   ```typescript
   bot.command("commandName", (ctx) => ctx.reply("Response"));
   ```

2. Event handlers follow:
   ```typescript
   bot.on("eventType", (ctx) => ctx.reply("Response"));
   ```

## Common Tasks

### Adding New Commands
Add new command handlers in `src/bot.ts` following the existing pattern:
```typescript
bot.command("newCommand", (ctx) => ctx.reply("Command response"));
```

### Development Mode
The `npm run dev` command:
- Watches for TypeScript changes and recompiles (`tsc --watch`)
- Automatically restarts the bot when code changes (`node --watch`)
- Preserves TypeScript watch output for better debugging

## Critical Notes
1. Bot token must be properly secured (currently hardcoded in `bot.ts`)
2. Project uses ESM modules - use `import`/`export` syntax
3. All source files should be in `src/` directory
4. TypeScript compilation outputs to `dist/`