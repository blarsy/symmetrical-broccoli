"use client"
import ClientLayout from "@/components/scaffold/ClientLayout"
import { Typography } from "@mui/material"

const Privacy = () => {
    return <ClientLayout title="Politique de confidentialié">
        <>
            <Typography variant="subtitle1">Nous accordons une grande importance à la confidentialit&#xE9; de vos donn&#xE9;es personnelles. Cette politique de confidentialit&#xE9; explique comment nous collectons, utilisons et prot&#xE9;geons les informations que vous nous fournissez lorsque vous utilisez notre application web.</Typography>
            <Typography variant="subtitle2">1. Collecte des donn&#xE9;es personnelles</Typography>
            <Typography variant="body1">Nous collectons uniquement les donn&#xE9;es personnelles n&#xE9;cessaires au bon fonctionnement de notre application web. Les informations que nous collectons peuvent inclure votre adresse e-mail, votre pseudo et les contenus que vous cr&#xE9;ez dans l&#x27;application.</Typography>
            <Typography variant="subtitle2">2. Utilisation des donn&#xE9;es personnelles</Typography>
            <Typography variant="body1">Nous utilisons les donn&#xE9;es personnelles collect&#xE9;es dans le but de vous fournir les services demand&#xE9;s par le biais de notre application web. Cela peut inclure l&#x27;envoi de notifications, la personnalisation de votre exp&#xE9;rience utilisateur et la gestion de votre compte.</Typography>
            <Typography variant="subtitle2">3. Partage des donn&#xE9;es personnelles</Typography>
            <Typography variant="body1">Nous ne partageons pas vos donn&#xE9;es personnelles avec des tiers, sauf dans les cas suivants :</Typography>
                <ul>
                    <li><Typography variant="body1">Si vous y consentez express&#xE9;ment.</Typography></li>
                    <li><Typography variant="body1">Si cela est n&#xE9;cessaire pour fournir les services demand&#xE9;s par le biais de notre application web.</Typography></li>
                    <li><Typography variant="body1">Si nous sommes tenus de le faire par la loi ou dans le cadre d&#x27;une proc&#xE9;dure judiciaire.</Typography></li>
                </ul>
            <Typography variant="subtitle2">4. S&#xE9;curit&#xE9; des donn&#xE9;es personnelles</Typography>
            <Typography variant="body1">Nous prenons des mesures de s&#xE9;curit&#xE9; appropri&#xE9;es pour prot&#xE9;ger vos donn&#xE9;es personnelles contre tout accès non autoris&#xE9;, toute divulgation, toute alt&#xE9;ration ou toute destruction. Cependant, veuillez noter qu&apos;aucune m&#xE9;thode de transmission sur Internet ou de stockage &#xE9;lectronique n&apos;est totalement s&#xE9;curis&#xE9;e.</Typography>
            <Typography variant="subtitle2">5. Conservation des donn&#xE9;es personnelles</Typography>
            <Typography variant="body1">Nous conservons vos donn&#xE9;es personnelles aussi longtemps que n&#xE9;cessaire pour fournir les services demand&#xE9;s par le biais de notre application web, sauf si une p&#xE9;riode de conservation plus longue est requise ou autoris&#xE9;e par la loi.</Typography>
            <Typography variant="subtitle2">6. Vos droits</Typography>
            <Typography variant="body1">Vous avez le droit d&apos;acc&#xE9;der, de rectifier, de supprimer ou de limiter l&apos;utilisation de vos donn&#xE9;es personnelles. Vous pouvez &#xE9;galement vous opposer au traitement de vos donn&#xE9;es personnelles ou demander leur portabilit&#xE9;. Pour exercer ces droits, veuillez nous contacter à l&apos;adresse indiqu&#xE9;e ci-dessous.</Typography>
            <Typography variant="subtitle2">7. Modifications de la politique de confidentialit&#xE9;</Typography>
            <Typography variant="body1">Nous nous r&#xE9;servons le droit de modifier cette politique de confidentialit&#xE9; à tout moment. Toute modification sera publi&#xE9;e sur cette page et entrera en vigueur imm&#xE9;diatement.</Typography>
            <Typography variant="body1">Si vous avez des questions ou des pr&#xE9;occupations concernant notre politique de confidentialit&#xE9;, veuillez nous contacter à l&apos;adresse suivante : topela.tech@gmail.com.</Typography>
        </>
    </ClientLayout>
}

export default Privacy