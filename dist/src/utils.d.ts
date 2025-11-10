import { SubscriptionType, Weekday, DanceType } from "@prisma/client";
export declare function calculateNextPaymentDate(classDays: Weekday[], remainingLessons: number): Date;
export declare function getTotalLessons(type: SubscriptionType): number;
export declare function formatGroupName(type: DanceType): string;
export declare function calculateUsedLessons(startDate: Date, classDays: Weekday[]): number;
export declare function formatSubscriptionType(type: SubscriptionType): string;
export declare function formatDate(date: Date): string;
//# sourceMappingURL=utils.d.ts.map