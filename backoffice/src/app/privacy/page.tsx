"use client"
import ClientLayout from "@/components/ClientLayout"
import { Typography } from "@mui/material"

const Privacy = () => {
    return <ClientLayout title="Politique de confidentialité">
        <>
            <Typography variant="subtitle1">Nous accordons une grande importance à la confidentialité de vos données personnelles. Cette politique de confidentialité explique comment nous collectons, utilisons et protégeons les informations que vous nous fournissez lorsque vous utilisez notre application web.</Typography>
            <Typography variant="subtitle2">1. Collecte des données personnelles</Typography>
            <Typography variant="body1">Nous collectons uniquement les données personnelles nécessaires au bon fonctionnement de notre application web. Les informations que nous collectons peuvent inclure votre adresse e-mail, votre pseudo et les contenus que vous créez dans l'application.</Typography>
            <Typography variant="subtitle2">2. Utilisation des données personnelles</Typography>
            <Typography variant="body1">Nous utilisons les données personnelles collectées dans le but de vous fournir les services demandés par le biais de notre application web. Cela peut inclure l'envoi de notifications, la personnalisation de votre expérience utilisateur et la gestion de votre compte.</Typography>
            <Typography variant="subtitle2">3. Partage des données personnelles</Typography>
            <Typography variant="body1">Nous ne partageons pas vos données personnelles avec des tiers, sauf dans les cas suivants :</Typography>
                <ul>
                    <li><Typography variant="body1">Si vous y consentez expressément.</Typography></li>
                    <li><Typography variant="body1">Si cela est nécessaire pour fournir les services demandés par le biais de notre application web.</Typography></li>
                    <li><Typography variant="body1">Si nous sommes tenus de le faire par la loi ou dans le cadre d'une procédure judiciaire.</Typography></li>
                </ul>
            
            <Typography variant="subtitle2">4. Sécurité des données personnelles</Typography>
            <Typography variant="body1">Nous prenons des mesures de sécurité appropriées pour protéger vos données personnelles contre tout accès non autorisé, toute divulgation, toute altération ou toute destruction. Cependant, veuillez noter qu'aucune méthode de transmission sur Internet ou de stockage électronique n'est totalement sécurisée.</Typography>
            <Typography variant="subtitle2">5. Conservation des données personnelles</Typography>
            <Typography variant="body1">Nous conservons vos données personnelles aussi longtemps que nécessaire pour fournir les services demandés par le biais de notre application web, sauf si une période de conservation plus longue est requise ou autorisée par la loi.</Typography>
            <Typography variant="subtitle2">6. Vos droits</Typography>
            <Typography variant="body1">Vous avez le droit d'accéder, de rectifier, de supprimer ou de limiter l'utilisation de vos données personnelles. Vous pouvez également vous opposer au traitement de vos données personnelles ou demander leur portabilité. Pour exercer ces droits, veuillez nous contacter à l'adresse indiquée ci-dessous.</Typography>
            <Typography variant="subtitle2">7. Modifications de la politique de confidentialité</Typography>
            <Typography variant="body1">Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. Toute modification sera publiée sur cette page et entrera en vigueur immédiatement.</Typography>
            <Typography variant="body1">Si vous avez des questions ou des préoccupations concernant notre politique de confidentialité, veuillez nous contacter à l'adresse suivante : topela.tech@gmail.com.</Typography>
        </>
    </ClientLayout>
}

export default Privacy