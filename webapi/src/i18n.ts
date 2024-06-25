import i18n from 'i18next'

export default (lng: string) => i18n.init({
    lng,
    resources: {
        en: { translation: {
            "recover_account_subject": "Account recovery",
            "recover_account_text": "Here is a link to recover your access on {{productName}} ",
            "restore_account_button_label": "Restore",
            "activate_email_subject": "Validate your email address",
            "activate_email_text": "Validate the email address you entered on {{productName}} ",
            "activate_email_button_label": "Validate",
            "no_plaintext_content": "This communication requires an HTML email client.",
            "chat_messages_summary_subject": "You've got chat messages on {{productName}}",
            "mail_settings_instructions": "You receive this mail because you have an account on {{productName}}. Change your communications preferences in the app to change the frequency of this type of email.",
            "full_date_format": "MM/DD/YYYY HH:mm",
            "date_format": "HH:mm"
        }},
        fr: { translation: {
            "recover_account_subject": "Récupération d'accès à votre compte'",
            "recover_account_text": "Voici un lien pour effectuer la récupération de votre compte sur {{productName}} ",
            "restore_account_button_label": "Restaurer",
            "activate_email_subject": "Validez votre adresse email",
            "activate_email_text": "Validez l'adresse email que vous avez liée à votre compte sur {{productName}} ",
            "activate_email_button_label": "Valider",
            "no_plaintext_content": "Ce message doit être visionné sur un client email HTML.",
            "chat_messages_summary_subject": "Vous avez reçu des messages sur {{productName}}",
            "mail_settings_instructions": "Vous recevez ce message parce que vous avez un compte sur {{productName}}. Pour modifier la fréquence de ce type de message, changez vos préférences dans l'app.",
            "full_date_format": "DD/MM/YYYY HH:mm",
            "date_format": "HH:mm"
        }}
    }
})