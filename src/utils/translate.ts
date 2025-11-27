import type {DanceType, SubscriptionType, Weekday, PaymentType} from "@prisma/client";
import type {MyContext} from "../bot";
import {I18n} from "@grammyjs/i18n";

const standaloneI18n = new I18n({
    defaultLocale: "en",
    directory: "locales",
    fluentBundleOptions: {
        useIsolating: false
    }
});

export function translateDanceType(type: DanceType, ctx: MyContext): string {
    return ctx.t(`enum-dance-${type.toLowerCase()}`);
}

export function translateSubscriptionType(type: SubscriptionType, ctx: MyContext): string {
    return ctx.t(`enum-sub-${type.toLowerCase()}`);
}

export function translateWeekday(weekday: Weekday, ctx: MyContext): string {
    return ctx.t(`enum-weekday-${weekday.toLowerCase()}`);
}

export function translatePaymentType(type: PaymentType, ctx: MyContext): string {
    return ctx.t(`enum-payment-${type.toLowerCase()}`);
}

export function translate(languageCode: string, key: string, params?: Record<string, string | number>): string {
    return standaloneI18n.t(languageCode, key, params);
}
