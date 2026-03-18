# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

- Use comments sparingly. Only comment complex code.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with Turbopack (port 3000) |
| `npm run build` | Production build |
| `npm run lint` | ESLint via `next lint` |
| `npm run test` | Run Vitest (watch mode) |
| `npx vitest run` | Run tests once (CI-style) |
| `npx vitest run src/path/to/__tests__/file.test.ts` | Run a single test file |
| `npm run setup` | Install deps + generate Prisma client + run migrations |
| `npm run db:reset` | Reset SQLite database |

## Architecture

UIGen is an AI-powered React component generator. Users describe components in a chat interface, Claude generates code via tool calls, and the result renders in a live iframe preview.

### Core Flow

1. **Chat** (`src/app/api/chat/route.ts`) — Streaming POST endpoint using Vercel AI SDK with Anthropic Claude (claude-haiku-4-5). Falls back to `MockLanguageModel` when no `ANTHROPIC_API_KEY` is set.
2. **AI Tools** — The AI has two tools for file manipulation:
   - `str_replace_editor` (`src/lib/tools/str-replace.ts`) — create, view, str_replace, insert operations
   - `file_manager` (`src/lib/tools/file-manager.ts`) — rename, delete operations
3. **Virtual File System** (`src/lib/file-system.ts`) — All generated files live in an in-memory `VirtualFileSystem`. Nothing is written to disk. The VFS is serialized to JSON for project persistence.
4. **Preview** (`src/lib/transform/jsx-transformer.ts`) — JSX files are transformed client-side via `@babel/standalone`, converted to blob URLs with ES module import maps (React from esm.sh, Tailwind from CDN), and loaded in a sandboxed iframe.
5. **Persistence** — Projects store messages and VFS data as JSON in SQLite via Prisma. Anonymous users' work is tracked in sessionStorage and transferred on sign-up.

### State Management

Two React contexts drive the app (no external state library):
- **ChatProvider** (`src/lib/contexts/chat-context.tsx`) — Wraps `@ai-sdk/react` `useChat` hook
- **FileSystemProvider** (`src/lib/contexts/file-system-context.tsx`) — Manages VFS state and processes AI tool call results

### AI-Generated Component Conventions

The AI system prompt (`src/lib/prompts/generation.tsx`) requires:
- Entry point is always `/App.jsx` with a default export
- Styling via Tailwind CSS only (no hardcoded styles, no HTML files)
- Internal imports use `@/` alias (e.g., `@/components/Calculator`)

### Auth

JWT-based (jose) with httpOnly cookie (`auth-token`). Server actions in `src/actions/` handle sign-up/sign-in/sign-out. Middleware (`src/middleware.ts`) protects API routes.

### Routing

- `/` — Home. Authenticated users redirect to most recent project; anonymous users see main content.
- `/[projectId]` — Project page (requires auth).
- `/api/chat` — Streaming AI chat endpoint.

## Project Structure

- `src/actions/` — Next.js Server Actions (`"use server"`) for auth and project CRUD
- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — React components (chat/, editor/, preview/, ui/, auth/)
- `src/hooks/` — Custom hooks (use-auth.ts)
- `src/lib/` — Core logic: VFS, auth, AI provider, contexts, tools, JSX transform
- `src/lib/tools/` — AI tool definitions (str_replace_editor, file_manager)
- `src/lib/transform/` — Babel JSX transformation and import map generation
- `src/components/ui/` — shadcn/ui components (new-york style)
- `prisma/schema.prisma` — Database schema. Reference this file to understand the structure of stored data.
- `prisma/dev.db` — SQLite database

## Tech Stack

- Next.js 15 (App Router, Turbopack), React 19, TypeScript
- Tailwind CSS v4 with `@tailwindcss/postcss`
- Prisma with SQLite (`prisma/dev.db`)
- Vercel AI SDK (`ai` + `@ai-sdk/anthropic`)
- shadcn/ui (new-york style) with Radix UI primitives
- Monaco Editor for code editing
- Vitest + React Testing Library + jsdom

## Testing

Vitest config is in `vitest.config.mts`. Tests are co-located in `__tests__/` directories next to source files. Uses Vitest with jsdom environment and `@vitejs/plugin-react`. Mocking pattern: `vi.mock()` for modules, `vi.fn()` for functions. Path alias `@/*` resolves via `vite-tsconfig-paths`.

## Environment Variables

- `ANTHROPIC_API_KEY` — Optional. Without it, a mock provider returns static component code.
- `JWT_SECRET` — Optional. Falls back to `"development-secret-key"`.
