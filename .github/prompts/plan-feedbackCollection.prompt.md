# Plan: Implement Feedback Collection System

A comprehensive feedback collection feature that captures user feedback via `/feedback` command, stores it in the database with full user context, and leverages grammY's conversation plugin for a multi-step interactive flow.

## Steps

1. **Create Feedback model in `prisma/schema.prisma`** — Add a `Feedback` model with fields for `id`, `userId`, `telegramId`, `message`, `userName`, `languageCode`, and timestamps; establish relation to `User` model; run `prisma migrate dev` to apply changes.

2. **Install grammY conversations plugin** — Run `npm install @grammyjs/conversations` to enable multi-step interactive flows for collecting structured feedback (message).

3. **Implement feedback conversation flow in `src/user/feedback.ts`** — Create a conversation that prompts for feedback message (required); validate input; save all user context (name, username, language, Telegram ID) to database; provide confirmation; handle cancellation.

4. **Register feedback system in `src/bot.ts`** — Add conversation session middleware, register feedback conversation and composer, add `/feedback` command to `COMMANDS` array with description.

5. **Update TypeScript types** — Add conversation types to context interface and ensure Prisma client regenerates with new Feedback model types.

6. **Implement admin notification system** — After feedback is saved to database, send notification to admin(s) with feedback details (user info, message); configure admin Telegram IDs in environment variables or constants.
