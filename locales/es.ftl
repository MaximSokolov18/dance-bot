# Commands
cmd-settings = Gestionar configuración del bot (ej. Recordatorios de pago)
cmd-mysub = Ver detalles de mi suscripción
cmd-feedback = Enviar comentarios o reportar un problema

# Common
common-error = ❌ Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado. Por favor, inténtalo de nuevo más tarde.
common-user-not-found = No hay ningún usuario con este ID
common-unable-to-identify = No se puede identificar al usuario. Por favor, inténtalo de nuevo.

# Start Command
start-welcome = ¡Bienvenido/a { $firstName }!
start-error = ❌ Lo sentimos, algo salió mal. Por favor, inténtalo de nuevo más tarde.

# My Subscription Command
mysub-no-account = Aún no tienes una cuenta. Usa /start para registrarte.
mysub-no-subscriptions = Aún no tienes suscripciones activas. Contacta a tu instructor para más detalles.
mysub-title = 🎭 Tu Suscripción:
mysub-type = Tipo: { $type }
mysub-group = Grupo: { $group }
mysub-lessons = Clases: { $remaining } de { $total } restantes
mysub-notifications = <b>Recordatorios de pago:</b> { $status }
mysub-notifications-enabled = Activadas
mysub-notifications-disabled = Desactivadas
mysub-illness = 

¡Que te mejores pronto! 🤒
Faltas por enfermedad: { $count }

mysub-schedule = Horario de clases:
mysub-schedule-item = • { $weekday } a las { $time }
mysub-holidays = 
📅 Días festivos:
mysub-holiday-item = • { $name }: { $date }
mysub-next-payment = <b>Próximo pago/renovación:</b>
{ $date }

# Feedback Command
feedback-prompt = 📝 ¡Comparte tus comentarios con nosotros!

Cuéntanos sobre tu experiencia, sugerencias o cualquier inquietud.

Escribe /cancel para cancelar en cualquier momento.
feedback-cancelled = ❌ Comentarios cancelados.
feedback-empty = ❌ Los comentarios no pueden estar vacíos. Por favor, inténtalo de nuevo con /feedback
feedback-thanks = ✅ ¡Gracias por tus comentarios!

Apreciamos que te hayas tomado el tiempo de compartir tus pensamientos con nosotros. Tus comentarios nos ayudan a mejorar nuestro servicio.

# Settings Command
settings-title = ⚙️ <b>Configuración</b>

settings-section-notifications = <b>Recordatorios de pago:</b> { $status }
settings-notify-enabled = Activadas

💡 Recibirás un recordatorio sobre la renovación de tu suscripción a las 11:00 AM el día de tu entrenamiento
settings-notify-disabled = Desactivadas
settings-section-language = <b>Idioma:</b> { $language }

settings-btn-notify-on = 🔔 Activar recordatorios
settings-btn-notify-off = 🔕 Desactivar recordatorios
settings-btn-lang-en = 🇬🇧 English
settings-btn-lang-es = 🇪🇸 Español
settings-btn-lang-uk = 🇺🇦 Українська

# Notifications
notification-renewal = 🔔 No olvides renovar tu suscripción hoy ({ $date }).

# Enums - Dance Types
enum-dance-jazzfunk = Jazz Funk
enum-dance-highheels = High Heels

# Enums - Subscription Types
enum-sub-eightlessons = Paquete de 8 Clases
enum-sub-fourlessons = Paquete de 4 Clases
enum-sub-onelesson = Clase Individual
enum-sub-trial = Clase de Prueba

# Enums - Payment Types
enum-payment-santander = Santander
enum-payment-cash = Efectivo
enum-payment-mono = Mono
enum-payment-other = Otro

# Enums - Weekdays
enum-weekday-monday = Lunes
enum-weekday-tuesday = Martes
enum-weekday-wednesday = Miércoles
enum-weekday-thursday = Jueves
enum-weekday-friday = Viernes
enum-weekday-saturday = Sábado
enum-weekday-sunday = Domingo
