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
            "activate_email_button_label": "Validate"
        }},
        fr: { translation: {
            "recover_account_subject": "Récupération d'accès à votre compte'",
            "recover_account_text": "Voici un lien pour effectuer la récupération de votre compte sur {{productName}} ",
            "restore_account_button_label": "Restaurer",
            "activate_email_subject": "Validez votre adresse email",
            "activate_email_text": "Validez l'adresse email que vous avez liée à votre compte sur {{productName}} ",
            "activate_email_button_label": "Valider"
        }}
    }
})