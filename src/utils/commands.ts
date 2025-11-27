import {I18n} from "@grammyjs/i18n";

// Create standalone i18n instance for command descriptions
const commandsI18n = new I18n({
    defaultLocale: "en",
    directory: "locales",
    fluentBundleOptions: {
        useIsolating: false
    }
});

export function getLocalizedCommands(languageCode: string = "en") {
    return [
        {
            command: "settings", 
            description: commandsI18n.t(languageCode, "cmd-settings")
        },
        {
            command: "mysub", 
            description: commandsI18n.t(languageCode, "cmd-mysub")
        },
        {
            command: "feedback", 
            description: commandsI18n.t(languageCode, "cmd-feedback")
        },
    ];
}
