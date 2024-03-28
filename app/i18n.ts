import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import LanguageDetector from 'i18next-browser-languagedetector'
import RNLanguageDetector from '@os-team/i18next-react-native-language-detector'
import { Platform } from 'react-native'

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
      "nameOrEmail_label": "Name or email",
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
      "introduce_yourself": "Présentez vous"
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
      "organization_name_label": "Nom de l'association",
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
      "nameOrEmail_label": "Nom ou email",
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
      "noConversationLoaded_label": "Aucune conversation pour l'instant ...",
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
      "introduce_yourself": "Présentez vous"
    }
  }
}

i18n
    .use(Platform.OS === "web" ? LanguageDetector : RNLanguageDetector)
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        compatibilityJSON: 'v3',
        resources,
        fallbackLng: 'fr',
        interpolation: {
        escapeValue: false // react already safes from xss
        }
    })

  export const t = i18n.t
  export default i18n