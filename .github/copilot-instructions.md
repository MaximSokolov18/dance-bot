# Dance Bot AI Agent Guidelines

## Architecture Overview

This is a **Telegram bot for dance studio subscription management** built with Grammy.js, TypeScript, Prisma ORM, and PostgreSQL. The bot helps students track their lesson packages, receive notifications, and provide feedback.

### Core Components

- **`src/bot.ts`**: Main bot entry point with Grammy web adapters and conversation setup
- **`src/user/`**: Feature modules (mysub, notify, feedback) using Grammy Composer pattern
- **`prisma/schema.prisma`**: Database schema defining User, Subscription, Group, Holiday models
- **`src/db.ts`**: Prisma client with Accelerate extension for connection pooling

## Key Development Patterns

### Bot Command Structure
```typescript
// Use Grammy Composer for modular commands
export const mysub = new Composer();
mysub.command("mysub", async (ctx) => { /* handler */ });

// Register in bot.ts with: bot.use(mysub);
```

### Database Queries
Always include related data in Prisma queries for subscription features:
```typescript
// Example from mysub.ts - fetch user with latest subscription and group
const user = await prisma.user.findUnique({
    where: {telegramId: ctx.from.id},
    include: {
        subscriptions: {
            include: { group: true },
            orderBy: { startDate: 'desc' },
            take: 1
        }
    }
});
```

### Date/Time Calculations
The bot calculates lesson usage and payment dates by:
1. Counting class days between start date and today (`calculateUsedLessons`)
2. Excluding holidays that fall on class days (`isDateInHoliday`)
3. Adding illness days back to available lessons
4. Finding next payment date after remaining lessons are consumed

### Conversation Pattern
Use Grammy conversations for multi-step interactions:
```typescript
// Define conversation function, register in bot.ts
bot.use(createConversation(feedbackConversation, "feedbackConversation"));
// Enter with: ctx.conversation.enter("feedbackConversation")
```

## Development Workflow

### Local Development
```bash
npm run dev          # Watch mode: compile TS + restart bot on changes
npm run prisma:studio # Database GUI at localhost:5555
npm run prisma:migrate # Apply schema changes
npm run prisma:generate # Regenerate client after schema changes
```

### Environment Setup
Required `.env` variables:
- `DATABASE_URL`: PostgreSQL connection string
- `BOT_TOKEN`: Telegram Bot API token
- `ADMIN_TELEGRAM_ID`: For feedback notifications (optional)

### Docker Deployment
Multi-stage build separates dependencies and runs both bot + Prisma Studio:
```bash
docker-compose up -d  # Starts bot with Prisma Studio on port 5555
```

## Project-Specific Conventions

### Enum Mappings
User-facing text uses formatting maps in `constants.ts`:
```typescript
GroupNameFormatMap[DanceType.JazzFunk] = "Jazz Funk"
SubscriptionTypeFormatMap[SubscriptionType.EightLessons] = "8 Lessons Package"
```

### Error Handling
Always check `ctx.from` existence for user commands and handle missing user/subscription states gracefully with informative messages.

### Notification System
Cron jobs are created per-user when notifications are enabled (`notify.ts`). The current implementation has a TODO for fixing scheduling logic - notifications should be scheduled globally, not per-user activation.

## Database Schema Notes

- **Subscriptions**: Track payment dates, lesson types, and illness adjustments
- **Groups**: Define dance types and class days (weekday enums)
- **Holidays**: Excluded from lesson calculations when they fall on class days
- **Feedback**: Stores user messages with admin notification system

## Integration Points

- **Telegram API**: Grammy.js handles webhooks and message routing
- **Prisma Accelerate**: Connection pooling for database performance
- **Node-cron**: Scheduled notifications (needs refactoring for production)

When adding features, follow the modular command pattern in `src/user/` and ensure proper TypeScript imports with `.js` extensions for ES modules.