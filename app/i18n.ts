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
      "resource_label": "Ressource",
      "chat_label": "Chat",
      "profile_label": "Profile",
      "name_too_long": "Please use a shorter name",
      "password_invalid": "The password must be at least 8 characters long, with at least one uppecase and at least one digit.",
      "passwords_dont_match": "Provided passwords are not identical.",
      "name_label": "Name",
      "save_label": "Save",
      "create_label": "Create",
      "register_page_title": "Sign up",
      "notsubscribedyet_label": "Not signed up yet ?",
      "cancel_caption": "Cancel",
      "ok_caption": "Ok",
      "editProfileMenuTitle": "Account",
      "friendsMenuTitle": "Network",
      "requestError": "Error while processing request",
      "noData": "No data",
      "myResourcesAccordionTitle": "My resources",
      "profileSettingsAccordionTitle": "Settings",
      "networkAccordionTitle": "My network",
      "back": "Back",
      "myNetwork_title": "Friends",
      "requestsReceived_title": "Friendship requests received",
      "requestsSent_title": "Friendship requests sent",
      "friends_buttonLabel": "Friends",
      "requestsReceived_buttonLabel": "Inbox",
      "requestsSent_buttonLabel": "Outbox",
      "network_label": "My network",
      "add_buttonLabel": "Add",
      "Atleast3chars": "At least 3 characters",
      "nameOrEmail_label": "Name or email",
      "newFriend_viewTitle": "Send an invitation",
      "invitationAccepted_Message": "'{{name}}' is now a connection",
      "invitationDeclined_Message": "Invitation from {{name}} declined",
      "invitationCancelled_Message": "Invitation sent to {{name}} cancelled",
      "forgotPassword_label": "Forgot password ?",
      "recoveryRequested_message": "A mail has been sent to your address. Please follow the instructions it provides to restore access to your account."
    }
  },
  fr: {
    translation: {
      "loading": "Chargement...",
      "save_error": "Erreur lors de la sauvegarde.",
      "login_page_title": "Connexion",
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
      "resource_label": "Resource",
      "chat_label": "Chat",
      "profile_label": "Profil",
      "name_too_long": "Veuillez utiliser un nom plus court",
      "password_invalid": "Le mot de passe doit comporter au moins 8 caractères, au moins une majustcule et un chiffre.",
      "passwords_dont_match": "Les mots de passe fournis ne sont pas identiques.",
      "name_label": "Nom",
      "save_label": "Sauver",
      "create_label": "Créer",
      "register_page_title": "Inscription",
      "notsubscribedyet_label": "Pas encore inscrit ?",
      "cancel_caption": "Annuler",
      "ok_caption": "Ok",
      "editProfileMenuTitle": "Compte",
      "friendsMenuTitle": "Réseau",
      "requestError": "Erreur pendant l'exécution de la requête",
      "noData": "Pas de donnée",
      "myResourcesAccordionTitle": "Ressources",
      "profileSettingsAccordionTitle": "Admin",
      "networkAccordionTitle": "Réseau",
      "back": "Retour",
      "myNetwork_title": "Amis",
      "requestsReceived_title": "Demandes d'amitié reçues",
      "requestsSent_title": "Demandes d'amitié envoyées",
      "friends_buttonLabel": "Amis",
      "requestsReceived_buttonLabel": "Invit. reçues",
      "requestsSent_buttonLabel": "Invit. envoyées",
      "network_label": "Mon réseau",
      "add_buttonLabel": "Ajouter",
      "Atleast3chars": "Au moins 3 caractères",
      "nameOrEmail_label": "Nom ou email",
      "newFriend_viewTitle": "Envoyer une invitation",
      "invitationAccepted_Message": "Vous êtes maintenant connecté à '{{name}}'",
      "invitationDeclined_Message": "L'invitation de {{name}} a été refusée",
      "invitationCancelled_Message": "L'invitation envoyée à {{name}} a été annulée",
      "forgotPassword_label": "Mot de passe oublié ?",
      "recoveryRequested_message": "Un email a été envoyé à votre adresse. Veuillez suivre les instructions qui s'y trouvent pour rétablir l'accès à votre compte."
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