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
                "open_on_mobile": "Please reopen the mobile app, and reconnect"
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
                "open_on_mobile": "Ouvrez l'app mobile pour vous reconnecter"
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