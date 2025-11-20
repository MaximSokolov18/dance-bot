export const ADMIN_USER_CALLBACKS = {
    LIST: "admin_user_list",
    VIEW: "admin_user_view",
    CREATE: "admin_user_create",
    UPDATE: "admin_user_update",
    DELETE: "admin_user_delete",
} as const;

export const USER_UPDATE_FIELDS = {
    FIRST_NAME: "upd_fname",
    LAST_NAME: "upd_lname",
    USERNAME: "upd_uname",
    NOTIFICATIONS: "upd_notify",
} as const;

export const ADMIN_GROUP_CALLBACKS = {
    LIST: "admin_grp_list",
    VIEW: "admin_grp_view",
    CREATE: "admin_grp_create",
    UPDATE: "admin_grp_update",
    DELETE: "admin_grp_delete",
} as const;

export const ADMIN_CLASS_DAY_CALLBACKS = {
    ADD: "admin_cd_add",
    DELETE: "admin_cd_delete",
} as const;

export const ADMIN_SUBSCRIPTION_CALLBACKS = {
    LIST: "admin_sub_list",
    VIEW: "admin_sub_view",
    CREATE: "admin_sub_create",
    UPDATE: "admin_sub_update",
    DELETE: "admin_sub_delete",
} as const;

export const SUBSCRIPTION_FILTERS = {
    ACTIVE: "filter_active",
    INACTIVE: "filter_inactive",
    ALL: "filter_all",
} as const;

export const SUBSCRIPTION_UPDATE_FIELDS = {
    ILLNESS: "upd_illness",
    AMOUNT: "upd_amount",
    END_DATE: "upd_enddate",
    STATUS: "upd_status",
} as const;

export const ADMIN_HOLIDAY_CALLBACKS = {
    LIST: "admin_hol_list",
    VIEW: "admin_hol_view",
    CREATE: "admin_hol_create",
    UPDATE: "admin_hol_update",
    DELETE: "admin_hol_delete",
} as const;

export const ADMIN_FEEDBACK_CALLBACKS = {
    LIST: "admin_fb_list",
    VIEW: "admin_fb_view",
} as const;

export const FEEDBACK_FILTERS = {
    ALL: "fb_all",
    USER: "fb_user",
    DATE: "fb_date",
} as const;

export const CONVERSATION_NAMES = {
    FEEDBACK: "feedbackConversation",
    
    ADMIN_USER_VIEW: "adminUserViewConversation",
    ADMIN_USER_CREATE: "adminUserCreateConversation",
    ADMIN_USER_UPDATE: "adminUserUpdateConversation",
    ADMIN_USER_DELETE: "adminUserDeleteConversation",
    
    ADMIN_SUBSCRIPTION_LIST: "adminSubscriptionsListConversation",
    ADMIN_SUBSCRIPTION_VIEW: "adminSubscriptionViewConversation",
    ADMIN_SUBSCRIPTION_CREATE: "adminSubscriptionCreateConversation",
    ADMIN_SUBSCRIPTION_UPDATE: "adminSubscriptionUpdateConversation",
    ADMIN_SUBSCRIPTION_DELETE: "adminSubscriptionDeleteConversation",
    
    ADMIN_GROUP_VIEW: "adminGroupViewConversation",
    ADMIN_GROUP_CREATE: "adminGroupCreateConversation",
    ADMIN_GROUP_UPDATE: "adminGroupUpdateConversation",
    ADMIN_GROUP_DELETE: "adminGroupDeleteConversation",
    
    ADMIN_CLASS_DAY_ADD: "adminClassDayAddConversation",
    ADMIN_CLASS_DAY_DELETE: "adminClassDayDeleteConversation",
    
    ADMIN_HOLIDAY_VIEW: "adminHolidayViewConversation",
    ADMIN_HOLIDAY_CREATE: "adminHolidayCreateConversation",
    ADMIN_HOLIDAY_UPDATE: "adminHolidayUpdateConversation",
    ADMIN_HOLIDAY_DELETE: "adminHolidayDeleteConversation",
    
    ADMIN_FEEDBACK_LIST: "adminFeedbackListConversation",
    ADMIN_FEEDBACK_VIEW: "adminFeedbackViewConversation",
} as const;
