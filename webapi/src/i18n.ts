import i18n, { TFunction } from 'i18next'

const translationFunctions = {} as { [lng: string]: TFunction<"translation", undefined> }
let root = undefined as TFunction<"translation", undefined> | undefined

const resources = {
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
        "date_format": "HH:mm",
        "sender_column_title": "Sender",
        "resource_title_column_title": "Resource",
        "sent_date_column_title": "Time received",
        "message_text_column_title": "Message",
        "new_resources_summary_subject": "New resources were created in {{productName}}",
        "creator_column_title": "Creator",
        "created_date_column_title": "Time",
        "multiple_new_things_summary_subject": "Things happened on {{productName}}",
        "newResources_mail_section_title": "Resources recently created",
        "chatMessages_mail_section_title": "Chat messages received",
        "new_resource_notification": "New resource available : "
        
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
        "date_format": "HH:mm",
        "sender_column_title": "Envoyeur",
        "resource_title_column_title": "Ressource concernée",
        "sent_date_column_title": "Heure d'envoi",
        "message_text_column_title": "Message",
        "new_resources_summary_subject": "Des nouvelles resources ont été créées dans {{productName}}",
        "creator_column_title": "Créateur",
        "created_date_column_title": "Heure",
        "multiple_new_things_summary_subject": "Des choses se sont passées sur {{productName}}",
        "newResources_mail_section_title": "Ressources récemment créées",
        "chatMessages_mail_section_title": "Messages reçus",
        "new_resource_notification": "Nouvelle ressource disponible : "
    }}
}

export default async (lng: string) => {
    if(!root) {
        root = await i18n.init({ resources })
    }
    if(!translationFunctions[lng]){
        translationFunctions[lng] = i18n.getFixedT(lng)
    }
    return translationFunctions[lng]
}