# Commands
cmd-settings = Керувати налаштуваннями бота (наприклад, нагадування про оплату)
cmd-mysub = Переглянути деталі моєї підписки
cmd-feedback = Надати відгук або повідомити про проблему

# Common
common-error = ❌ Сталася неочікувана помилка. Нашу команду повідомлено. Будь ласка, спробуйте пізніше.
common-user-not-found = Немає користувача з таким ID
common-unable-to-identify = Не вдається ідентифікувати користувача. Будь ласка, спробуйте ще раз.

# Start Command
start-welcome = Вітаємо, { $firstName }!
start-error = ❌ Вибачте, щось пішло не так. Будь ласка, спробуйте пізніше.

# My Subscription Command
mysub-no-account = У вас ще немає облікового запису. Використайте /start для реєстрації.
mysub-no-subscriptions = У вас ще немає активних підписок. Зв'яжіться з тренером для деталей.
mysub-title = 🎭 Ваша підписка:
mysub-type = Тип: { $type }
mysub-group = Група: { $group }
mysub-lessons = Заняття: { $remaining } з { $total } залишилось
mysub-notifications = <b>Нагадування про оплату:</b> { $status }
mysub-notifications-enabled = Увімкнено
mysub-notifications-disabled = Вимкнено
mysub-illness = 

Одужуйте швидше 🤒
Пропущено через хворобу: { $count }

mysub-schedule = Розклад занять:
mysub-schedule-item = • { $weekday } о { $time }
mysub-holidays = 📅 Святкові дні:
mysub-holiday-item = • { $name }: { $date }
mysub-next-payment = <b>Наступний платіж/продовження:</b>
{ $date }

# Feedback Command
feedback-prompt = 📝 Будь ласка, поділіться з нами своїм відгуком!

Розкажіть про свій досвід, пропозиції чи будь-які проблеми.

Введіть /cancel щоб скасувати в будь-який момент.
feedback-cancelled = ❌ Відгук скасовано.
feedback-empty = ❌ Відгук не може бути порожнім. Будь ласка, спробуйте ще раз за допомогою /feedback
feedback-thanks = ✅ Дякуємо за ваш відгук!

Ми цінуємо, що ви знайшли час поділитися своїми думками з нами. Ваш відгук допомагає нам покращувати наш сервіс.

# Settings Command
settings-title = ⚙️ <b>Налаштування</b>

settings-section-notifications = <b>Нагадування про оплату:</b> { $status }
settings-notify-enabled = Увімкнено

💡 Ви отримаєте нагадування про продовження підписки о 11:00 ранку в день вашого тренування
settings-notify-disabled = Вимкнено
settings-section-language = <b>Мова:</b> { $language }

settings-btn-notify-on = 🔔 Увімкнути нагадування
settings-btn-notify-off = 🔕 Вимкнути нагадування
settings-btn-lang-en = 🇬🇧 English
settings-btn-lang-es = 🇪🇸 Español
settings-btn-lang-uk = 🇺🇦 Українська

# Notifications
notification-renewal = 🔔 Не забудьте продовжити підписку сьогодні ({ $date }).

# Enums - Dance Types
enum-dance-jazzfunk = Jazz Funk
enum-dance-highheels = High Heels

# Enums - Subscription Types
enum-sub-eightlessons = Пакет з 8 занять
enum-sub-fourlessons = Пакет з 4 занять
enum-sub-onelesson = Одне заняття
enum-sub-trial = Пробне заняття

# Enums - Payment Types
enum-payment-santander = Santander
enum-payment-cash = Готівка
enum-payment-mono = Mono
enum-payment-other = Інше

# Enums - Weekdays
enum-weekday-monday = Понеділок
enum-weekday-tuesday = Вівторок
enum-weekday-wednesday = Середа
enum-weekday-thursday = Четвер
enum-weekday-friday = П'ятниця
enum-weekday-saturday = Субота
enum-weekday-sunday = Неділя
