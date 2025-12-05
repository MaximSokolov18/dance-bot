# Commands
cmd-settings = Manage bot settings (e.g. Payment reminders)
cmd-mysub = View my subscription details
cmd-feedback = Provide feedback or report an issue

# Common
common-error = ❌ An unexpected error occurred. Our team has been notified. Please try again later.
common-user-not-found = There is no user with this ID
common-unable-to-identify = Unable to identify user. Please try again.

# Start Command
start-welcome = Welcome { $firstName }!
start-error = ❌ Sorry, something went wrong. Please try again later.

# My Subscription Command
mysub-no-account = You don't have an account yet. Use /start to register.
mysub-no-subscriptions = You don't have any active subscriptions yet. Contact your trainer for details.
mysub-title = 🎭 Your Subscription:
mysub-type = Type: { $type }
mysub-group = Group: { $group }
mysub-lessons = Lessons: { $remaining } of { $total } remaining
mysub-notifications = <b>Payment reminders:</b> { $status }
mysub-notifications-enabled = Enabled
mysub-notifications-disabled = Disabled
mysub-illness = 

Get well soon 🤒
Missed due to illness: { $count }

mysub-schedule = Class schedule:
mysub-schedule-item = • { $weekday } at { $time }
mysub-holidays = 📅 Holidays:
mysub-holiday-item = • { $name }: { $date }
mysub-next-payment = <b>Next payment/renewal:</b>
{ $date }

# Feedback Command
feedback-prompt = 📝 Please share your feedback with us!

Tell us about your experience, suggestions, or any concerns.

Type /cancel to cancel at any time.
feedback-cancelled = ❌ Feedback cancelled.
feedback-empty = ❌ Feedback cannot be empty. Please try again with /feedback
feedback-thanks = ✅ Thank you for your feedback!

We appreciate you taking the time to share your thoughts with us. Your feedback helps us improve our service.

# Settings Command
settings-title = ⚙️ <b>Settings</b>

settings-section-notifications = <b>Payment reminders:</b> { $status }
settings-notify-enabled = Enabled

💡 You'll receive a reminder about renewing your subscription at 11:00 AM on your training day
settings-notify-disabled = Disabled
settings-section-language = <b>Language:</b> { $language }

settings-btn-notify-on = 🔔 Enable reminders
settings-btn-notify-off = 🔕 Disable reminders
settings-btn-lang-en = 🇬🇧 English
settings-btn-lang-es = 🇪🇸 Español
settings-btn-lang-uk = 🇺🇦 Українська

# Notifications
notification-renewal = 🔔 Don't forget to renew your subscription today ({ $date }).

# Enums - Dance Types
enum-dance-jazzfunk = Jazz Funk
enum-dance-highheels = High Heels

# Enums - Subscription Types
enum-sub-eightlessons = 8 Lessons Package
enum-sub-fourlessons = 4 Lessons Package
enum-sub-onelesson = Single Lesson
enum-sub-trial = Trial Lesson

# Enums - Payment Types
enum-payment-santander = Santander
enum-payment-cash = Cash
enum-payment-mono = Mono
enum-payment-other = Other

# Enums - Weekdays
enum-weekday-monday = Monday
enum-weekday-tuesday = Tuesday
enum-weekday-wednesday = Wednesday
enum-weekday-thursday = Thursday
enum-weekday-friday = Friday
enum-weekday-saturday = Saturday
enum-weekday-sunday = Sunday
