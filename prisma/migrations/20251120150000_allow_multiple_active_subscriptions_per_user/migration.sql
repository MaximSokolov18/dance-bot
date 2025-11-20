-- DropIndex
DROP INDEX "unique_active_subscription";

-- CreateIndex
CREATE UNIQUE INDEX "unique_active_subscription_per_group" ON "Subscription"("userId", "groupId", "isActive");
