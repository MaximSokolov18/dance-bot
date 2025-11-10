#!/bin/sh

# Start Prisma Studio in the background
echo "Starting Prisma Studio..."
npx prisma studio &

# Start the bot in the foreground
echo "Starting Dance Bot..."
npm start
