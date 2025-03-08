import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

export default (lang?: string) => {
    const resources = {
        en: { 
            translation: {
                "email_activated": 'Email validated on your account',
                "activation_error": "An error occured during activation. Please try again later, and contact us if the problem persists.",
                "invalid_password_format": "Invalid password. Please enter at least 8 characters, featuring at least 1 uppercase and 1 special character.",
                "recovery_error": "An error occured during recovery. Please try again later, and contact us if the problem persists.",
                "passwords_not_identical": "Passwords and repeated passwords do not match.",
                "recovery_title": "Account recovery",
                "required_field": "Mandatory field",
                "password_changed": "Your password has been changed successfully",
                "open_on_mobile": "Please reopen the mobile app, and reconnect",
                "moreOptions": "More options",
                "natureOptionsLabel": "Nature",
                "exchangeTypeOptionsLabel": "Exchange type",
                "deliveryOptionsLabel": "Acheminement",
                "isProduct": "Product",
                "isService": "Service",
                "canBeGifted": "Gift",
                "canBeExchanged": "Barter",
                "canBeTakenAway": "Take away",
                "canBeDelivered": "Delivery",
                "categoriesTitle": "Categories",
                "filtersTitle": "Filters",
                "proximityTitle": "Proximity",
                "noLocationSet": "First set a reference location",
                "setLocationDialogTitle": "Set location",
                "includeUnlocatedResourcesLabel": "Include resource with no location defined",
                "distanceTo": " km from",
                "okButton": "Ok",
                "cancelButton": "Cancel",
                "searchButtonCaption": "Search",
                "connectDialogTitle": "Connect to Tope-là",
                "mustBeValidEmail": "must be a valid email address",
                "requiredField": "must be provided",
                "passwordLabel": "Password",
                "connectButton": "Connect",
                "preferencesMenuCaption": "Preferences",
                "someDataInvalid": "Save failed: values missing or invalid",
                "nameFieldLabel": "Account name",
                "nameTooLong": "Please use a shorter name",
                "requestError": "Error while processing request",
                "emailFieldLabel": "Email",
                "invalidEmail": "Email address format incorrect",
                "selectLocalFileButton": "Choose a local file",
                "dragImageHere": "... or drop an image here",
                "uploadButtonCaption": "Done",
                "newEmailMustBeActivated": "The new email address should be activated by clicking on the link sent there.",
                "logoutMenuCaption" : "Logout",
                "conectWithGoogleButtonCaption": "Connect with Google"
            }
        },
        fr: { 
            translation: {
                "email_activated": 'L\'email de votre compte est validé',
                "activation_error": "Une erreur s'est produite durant l'activation. Veuillez rééssayer plus tard, et nous contacter si le problème persiste.",
                "invalid_password_format": "Mot de passe invalide. Au moins 8 caractères, dont une majuscule et un caractère spécial.",
                "recovery_error": "Une erreur s'est produite durant l'activation. Veuillez rééssayer plus tard, et nous contacter si le problème persiste.",
                "passwords_not_identical": "Ce mot de passe n'est pas identique à celui du dessus.",
                "recovery_title": "Récupération de compte",
                "required_field": "Ce champ est requis",
                "password_changed": "Votre mot de passe a été changé",
                "open_on_mobile": "Ouvrez l'app mobile pour vous reconnecter",
                "moreOptions": "Plus d'options",
                "natureOptionsLabel": "Nature",
                "exchangeTypeOptionsLabel": "Type d'échange",
                "deliveryOptionsLabel": "Acheminement",
                "isProduct": "Produit",
                "isService": "Service",
                "canBeGifted": "Don",
                "canBeExchanged": "Troc",
                "canBeTakenAway": "A emporter",
                "canBeDelivered": "Livraison",
                "categoriesTitle": "Categories",
                "filtersTitle": "Filtres",
                "proximityTitle": "Proximité",
                "noLocationSet": "Veuillez définir une location de référence",
                "setLocationDialogTitle": "Définir une location",
                "includeUnlocatedResourcesLabel": "Inclure les resources sans location définie",
                "distanceTo": " km de ",
                "okButton": "Ok",
                "cancelButton": "Annuler",
                "searchButtonCaption": "Recherche",
                "connectDialogTitle": "Connecte-toi à Tope-là",
                "mustBeValidEmail": "doit être une adresse email valide",
                "requiredField": "doit être remplis",
                "passwordLabel": "Mot de passe",
                "connectButton": "Se connecter",
                "preferencesMenuCaption": "Préférences",
                "someDataInvalid": "Echec: valeurs manquantes ou invalides",
                "nameFieldLabel": "Nom du compte",
                "nameTooLong": "Veuillez utiliser un nom plus court",
                "requestError": "Une erreur est survenue pendant l'éxécution de la requête",
                "emailFieldLabel": "Email",
                "invalidEmail": "Format de l'adresse email incorrect",
                "selectLocalFileButton": "Choisir un fichier",
                "dragImageHere": "... ou déposer une image ici",
                "uploadButtonCaption": "Terminé",
                "newEmailMustBeActivated": "Le nouvel email doit encore être confirmé en cliquant sur le lien qui y a été envoyé.",
                "logoutMenuCaption" : "Déconnexion",
                "conectWithGoogleButtonCaption": "Se connecter avec Google"
            }
        }
    }

    if(!lang) {
        return i18n
            .use(LanguageDetector)
            .init({
                fallbackLng: 'fr',
                resources
            })
    } else {
        return i18n.init({
            lng: lang,
            resources
        })
    }
} 