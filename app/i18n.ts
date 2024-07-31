import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from 'i18next-browser-languagedetector'
import RNLanguageDetector from '@os-team/i18next-react-native-language-detector'
import { Platform } from 'react-native'
import Constants from 'expo-constants'
import { storybookFakeLanguageDetector } from "./lib/storybookFakeLanguageDetector"

const resources = {
  en: {
    translation: {
      "loading": "Loading...",
      "save_error": "Error occured while saving.",
      "login_page_title": "Connection",
      "recovery_page_title": "Restore access",
      "field_required": "Field is required",
      "invalid_email": "invalid email",
      "connection_error": "Error occured while connecting.",
      "registration_error": "Error while signing up.",
      "email_label": "Email",
      "password_label": "Password",
      "repeatpassword_label": "Repeat new password",
      "newpassword_label": "New password",
      "repeatnewpassword_label": "Repeat new password",
      "connection_label": "Connection",
      "search_label": "Search",
      "history_label": "History",
      "resource_label": "Resources",
      "chat_label": "Chat",
      "profile_label": "Profile",
      "name_too_long": "Please use a shorter name",
      "password_invalid": "The password must be at least 8 characters long, with at least one uppercase and at least one non-letter character.",
      "passwords_dont_match": "Provided passwords are not identical.",
      "organization_name_label": "Organization name",
      "save_label": "Save",
      "create_label": "Create",
      "register_page_title": "Sign up",
      "notsubscribedyet_label": "Not signed up yet ?",
      "cancel_caption": "Cancel",
      "ok_caption": "Ok",
      "editProfileMenuTitle": "Account",
      "requestError": "Error while processing request",
      "noData": "No data",
      "back": "Back",
      "add_buttonLabel": "Add",
      "Atleast3chars": "At least 3 characters",
      "forgotPassword_label": "Forgot password ?",
      "recoveryRequested_message": "A mail has been sent to your address. Please follow the instructions it provides to restore access to your account.",
      "newResource_viewTitle": "Create resource",
      "viewResource_viewTitle": "View resource",
      "editResource_viewTitle": "Edit resource",
      "date_mustBeFuture": "This date must be in the future",
      "title_label": "Title",
      "brought_by_label": "Brought by",
      "description_label": "Description",
      "noDate": "No date selected",
      "dateFormat": "MM/DD/YYYY",
      "condensedDateFormat": "DD/MM/YY",
      "shortDateFormat": "MM/DD",
      "dateTimeFormat": "MM/DD/YYYY HH:mm",
      "expiration_label": "Expiration",
      "addPictures_Button": "Add pictures",
      "nature_label": "Nature",
      "resourceCategories_label": "Categories",
      "Confirmation_DialogTitle": "Confirmation",
      "Confirm_Resource_Delete_Question": "Are you sure you want to delete this resource ?",
      "isProduct_label": "Product",
      "isService_label": "Service",
      "type_label": "Exchange type",
      "canBeGifted_label": "Gift",
      "canBeExchanged_label": "Barter",
      "transport_label": "Transport",
      "canBeTakenAway_label": "Take away",
      "canBeDelivered_label": "Delivery",
      "nature_required": "Please select at least one option",
      "transport_required": "Please select at least one option",
      "exchangeType_required": "Please select at least one option",
      "close_buttonCaption": "Close",
      "done_buttonCaption": "Ok",
      "options_title": "Options",
      "noConversationLoaded_label": "No conversation yet ...",
      "search_hint": "What are you looking for ?",
      "published_at": "Published ",
      "back_label": "Back",
      "authentication_failed": "Authentication failed",
      "change_password_label": "Change password",
      "success_message": "Operation successful",
      "password_changed_message": "Password change successful",
      "recover_label": "Restore",
      "modify_logo": "Modify logo",
      "activate_account": "Your email address has not been validated. Your resources are currently not visible. Please click on the link in the email you received at {{email}}",
      "send_activation_mail_again_button": "Send again",
      "error_sending_again": "An error occured whe sending the activation mail again.",
      "newEmailMustBeActivated_message": "The change of email address will proceed when you click on the link you received on the new address.",
      "hide_button": "Hide",
      "connect_to_create_ressource": "Almost ready !",
      "resource_is_free": "Your first resources are free, and they will always be.",
      "connect_to_chat": "Sign in to create conversations.",
      "introduce_yourself": "Introduce yourself",
      "delete_account_button": "Delete my account",
      "delete_account_title": "Account removal",
      "delete_account_explanation": "Deleting your account will erase all information we have about you.\nYou will not be able to connect anymore, and Tope-là will not be able to retrieve your information.",
      "delete_account_confirmation": "This will completely erase your data, and cannot be undone.\nDo you confirm that is what you want ?",
      "name_account_removed": "Deleted account",
      "cannot_send_to_deleted_account": "Cannot send to deleted account",
      "type_message_here": "Your message here ...",
      "yes": "YES",
      "no": "NO",
      "deleted": "deleted",
      "resource_deleted": "This resource was deleted on {{deleted}}",
      "must_update_app": "Please update the app to benefit from the latest improvements.",
      "update_button": "Update",
      "available_resources": "Available resources",
      "links": "Links",
      "no_available_resource": "No resource available at this time.",
      "no_link": "No link",
      "link_dialog_title": "My account link",
      "url_label": "Address (https://...)",
      "link_label_label": "Label",
      "link_label_too_long": "Please provide a shorter label",
      "not_a_valid_url": "Invalid URL format",
      "link_button_default_label": "link...",
      "send_a_message": "Tell us !",
      "support_info": "System info",
      "support_title": "Help & support",
      "support_intro_text": "Tope-là is still young, so we expect issues, \nHelp us improve: tell us anything that feels wrong with Tope-là !",
      "support_mail_subject": "User message",
      "support_message_label": "Your message",
      "send_buttonCaption": "Send",
      "main_profile_label": "Main",
      "publicInfo_profile_label": "Public",
      "preferences_profile_label": "Preferences",
      "min_1_day_message": "At least 1 day",
      "max_30_days_message": "At most 30 days",
      "newResources_broadcast_prefs_title": "New resources for me",
      "chat_broadcast_prefs_title": "New chat messages",
      "number_of_days_between_summaries": "Email summary frequency (days)",
      "option_realtime": "Realtime in app",
      "option_regularSummary": "Email summaries",
      "notifications_settings_title": "Notification settings",
      "publicInfo_settings_title": "Your activity's promotional links",
      "faq_title": "Frequently asked questions",
      "faq_button_label": "Questions",
      "look_for_me": "Look for me on the 'Search' screen !",
      "no_resource_created_yet": "You did not create any resource yet",
      "bug_issue_title": "Bug / issue ?",
      "faq_explainer": "Our 'frequently asked questions' are available on our website www.tope-la.com:",
      "create_circular_economy": "The resources you will create will be managed here",
      "example": "Example",
      "examples": "Examples",
      "title_example_resource_available_timeslots": "Available session",
      "description_example_resource_available_timeslots": "In May, on appointment",
      "title_example_resource_things_to_rent": "Equipment to lend",
      "description_example_resource_things_to_rent": "No need to buy one",
      "title_example_resource_unused_object": "Unused objects",
      "description_example_resource_unused_object": "To give or exchange",
      "publicInfo_address_title": "Location",
      "type_address_prompt": "Enter the address here ...",
      "adjust_pin_instructions": "If necessary, adjust the pin by long touching it, then dragging it.",
      "no_address_defined": "Address not defined",
      "setLocation_dialog_title": "Set address",
      "confirmation_unlink_account_location": "Remove this location ?",
      "resource_location_label": "Address",
      "address_label": "Location"
    }
  },
  fr: {
    translation: {
      "loading": "Chargement...",
      "save_error": "Erreur lors de la sauvegarde.",
      "login_page_title": "Connexion",
      "recovery_page_title": "Récupération d'accès",
      "field_required": "Ce champ est requis",
      "invalid_email": "adresse email invalide",
      "connection_error": "Erreur lors de la connexion.",
      "registration_error": "Erreur lors de l'enregistrement.",
      "email_label": "Email",
      "password_label": "Mot de passe",
      "repeatpassword_label": "Répétition mot de passe",
      "newpassword_label": "Nouveau mot de passe",
      "repeatnewpassword_label": "Répétition nouveau mot de passe",
      "connection_label": "Connexion",
      "search_label": "Recherche",
      "history_label": "Historique",
      "resource_label": "Ressources",
      "chat_label": "Chat",
      "profile_label": "Profil",
      "name_too_long": "Veuillez utiliser un nom plus court",
      "password_invalid": "Le mot de passe doit comporter au moins 8 caractères, au moins une majustcule et un caractère non-alphabétique.",
      "passwords_dont_match": "Les mots de passe fournis ne sont pas identiques.",
      "organization_name_label": "Nom de l'activité",
      "save_label": "Sauver",
      "create_label": "Créer",
      "register_page_title": "Inscription",
      "notsubscribedyet_label": "Pas encore inscrit ?",
      "cancel_caption": "Annuler",
      "ok_caption": "Ok",
      "editProfileMenuTitle": "Compte",
      "requestError": "Erreur pendant l'exécution de la requête",
      "noData": "Pas de donnée",
      "back": "Retour",
      "add_buttonLabel": "Ajouter",
      "Atleast3chars": "Au moins 3 caractères",
      "forgotPassword_label": "Mot de passe oublié ?",
      "recoveryRequested_message": "Un email a été envoyé à votre adresse. Veuillez suivre les instructions qui s'y trouvent pour rétablir l'accès à votre compte.",
      "newResource_viewTitle": "Créer ressource",
      "viewResource_viewTitle": "Visualiser ressource",
      "editResource_viewTitle": "Modifier ressource",
      "date_mustBeFuture": "Cette date doit être dans le futur",
      "title_label": "Titre",
      "brought_by_label": "Proposé par",
      "description_label": "Description",
      "noDate": "Aucune date sélectionnée",
      "dateFormat": "DD/MM/YYYY",
      "condensedDateFormat": "DD/MM/YY",
      "shortDateFormat": "DD/MM",
      "dateTimeFormat": "DD/MM/YYYY HH:mm",
      "expiration_label": "Expiration",
      "addPictures_Button": "Ajouter des photos",
      "nature_label": "Nature",
      "resourceCategories_label": "Catégories",
      "Confirmation_DialogTitle": "Confirmation",
      "Confirm_Resource_Delete_Question": "Etes-vous sûr.e de vouloir supprimer cette ressource ?",
      "isProduct_label": "Produit",
      "isService_label": "Service",
      "type_label": "Type d'échange",
      "canBeGifted_label": "Don",
      "canBeExchanged_label": "Troc",
      "transport_label": "Transport",
      "canBeTakenAway_label": "A emporter",
      "canBeDelivered_label": "Livraison",
      "nature_required": "Choissisez au moins une option",
      "transport_required": "Choissisez au moins une option",
      "exchangeType_required": "Choissisez au moins une option",
      "close_buttonCaption": "Annuler",
      "done_buttonCaption": "Ok",
      "options_title": "Options",
      "noConversationLoaded_label": "Pas encore de conversation ...",
      "search_hint": "Qu'est-ce que tu recherches ?",
      "published_at": "Publié le ",
      "back_label": "Retour",
      "authentication_failed": "La connexion a échoué avec cet email et ce mot de passe",
      "change_password_label": "Changer le mot de passe",
      "success_message": "Operation réussie",
      "password_changed_message": "Mot de passe changé",
      "recover_label": "Restaurer",
      "modify_logo": "Modifier le logo",
      "activate_account": "Votre adresse email n'est pas encore validée. Vos ressources ne sont pas visibles tant que vous n'avez pas cliqué sur le lien reçu à {{email}}.",
      "send_activation_mail_again_button": "Envoyer de nouveau",
      "error_sending_again": "Une erreur est survenu pendant le réenvoi du mail d'activation.",
      "newEmailMustBeActivated_message": "Le changement de votre adresse email sera pris en compte quand vous aurez cliqué sur le lien reçu à la nouvelle adresse.",
      "hide_button": "Cacher",
      "connect_to_create_ressource": "Presque fini !",
      "resource_is_free": "Les premières ressources sont gratuites, et le seront toujours.",
      "connect_to_chat": "Pour créer des conversations, connectez-vous.",
      "introduce_yourself": "Présentez vous",
      "delete_account_button": "Effacer mon compte",
      "delete_account_title": "Effacement du compte",
      "delete_account_explanation": "Effacer votre compte éliminera toute les informations que nous détenons de vous.\nIl ne vous sera plus possible de vous reconnecter, et Tope-là ne sera plus en mesure de retrouver vos informations.",
      "delete_account_confirmation": "Cet action va effacer complètement vos données, et elles seront totalement irrécupérables.\nVeuillez confirmer une dernière fois",
      "name_account_removed": "Compte supprimé",
      "cannot_send_to_deleted_account": "Envoi impossible au compte supprimé",
      "type_message_here": "Votre message ...",
      "yes": "OUI",
      "no": "NON",
      "deleted": "Effacé",
      "resource_deleted": "Cette ressource a été effacée le {{deleted}}",
      "must_update_app": "Veuillez mettre à jour l'app pour bénéficier des dernières fonctionnalités.",
      "update_button": "Mettre à jour",
      "available_resources": "Ressources disponibles",
      "links": "Liens",
      "no_available_resource": "Pas de ressource disponible pour le moment.",
      "no_link": "Aucun lien",
      "link_dialog_title": "Lien de mon compte",
      "url_label": "Adresse (https://...)",
      "link_label_label": "Texte",
      "link_label_too_long": "Ce texte est trop long",
      "not_a_valid_url": "Format d'adresse invalide",
      "link_button_default_label": "lien...",
      "send_a_message": "Dites-nous !",
      "support_info": "Infos système",
      "support_title": "Aide & support",
      "support_intro_text": "Tope-là est encore jeune, donc nous nous attendons à des soucis.\nAidez-nous à l'améliorer: donnez-nous des infos à propos de quoi que ce soit qui n'a pas l'air normal dans Tope-là !",
      "support_mail_subject": "Message utilisateur",
      "support_message_label": "Votre message",
      "send_buttonCaption": "Envoyer",
      "main_profile_label": "Principal",
      "publicInfo_profile_label": "Public",
      "preferences_profile_label": "Preférences",
      "min_1_day_message": "Au moins 1 jour",
      "max_30_days_message": "Au plus 30 jours",
      "newResources_broadcast_prefs_title": "Nouvelles ressources pour moi",
      "chat_broadcast_prefs_title": "Messages chat reçus",
      "number_of_days_between_summaries": "Fréquence emails de résumé (jours)",
      "option_realtime": "Temps réél dans l'app",
      "option_regularSummary": "Résumés par email",
      "notifications_settings_title": "Paramètres de notification",
      "publicInfo_settings_title": "Liens de promotion de votre activité",
      "faq_title": "Foire aux questions",
      "faq_button_label": "Questions",
      "look_for_me": "Cherchez-moi sur l'écran 'Rechercher' !",
      "no_resource_created_yet": "Vous n'avez pas encore créé de ressource",
      "bug_issue_title": "Bug / problème ?",
      "faq_explainer": "Notre 'foire aux questions' est disponible sur notre site web www.tope-la.com:",
      "create_circular_economy": "Les ressources que vous allez créer seront gérées ici",
      "example": "Exemple",
      "examples": "Exemples",
      "title_example_resource_available_timeslots": "Séance disponible",
      "description_example_resource_available_timeslots": "En Mai, sur rendez-vous",
      "title_example_resource_things_to_rent": "Matos à prêter",
      "description_example_resource_things_to_rent": "Pas besoin d'un nouveau",
      "title_example_resource_unused_object": "Objet inutilisé",
      "description_example_resource_unused_object": "A donner ou échanger",
      "publicInfo_address_title": "Localisation",
      "type_address_prompt": "Entrez l'adresse ici ...",
      "adjust_pin_instructions": "Si nécessaire, ajustez l'épingle en la touchant longtemps, puis en la glissant avec le doigt.",
      "no_address_defined": "Adresse non définie",
      "setLocation_dialog_title": "Définir l'adresse",
      "confirmation_unlink_account_location": "Enlever cette adresse ?",
      "resource_location_label": "Adresse",
      "address_label": "Adresse"
    }
  }
}

const getLanguageDetector = (): LanguageDetector => {
  if(Constants.expoConfig?.extra?.storybookEnabled === "true") {
    return storybookFakeLanguageDetector
  } else if(Platform.OS === "web") {
    return LanguageDetector
  } else {
    return RNLanguageDetector
  }
}

i18n
    .use(getLanguageDetector())
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        compatibilityJSON: 'v3',
        resources,
        fallbackLng: 'fr',
        interpolation: {
          escapeValue: false // react already safes from xss
        }
    })
  export const language = i18n.language
  export const t = i18n.t
  export default i18n