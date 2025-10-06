"use client"
import ClientLayout from "@/components/scaffold/ClientLayout"
import { usePagePath } from "@/lib/usePagePath"
import { Box, Typography } from "@mui/material"
import { Suspense } from "react"

const Support = () => {
    const { version } = usePagePath()
    
    return <ClientLayout title="Support" version={version}>
        <>
            <Typography variant="subtitle1">Pour tout problème ou remarque lors de l&quot;utilisation de nos produits:</Typography>
            <Typography variant="subtitle2" fontSize="2.5rem"><a href="mailto://topela.hello@gmail.com">topela.hello@gmail.com</a></Typography>
            <Box padding="2rem">
                <Typography variant="subtitle1">Pour acc&#xE9;l&#xE9;rer la prise en charge d&#x27;un probl&#xE8;me technique, veuillez, si possible, inclure:</Typography>
                <Typography variant="body1">
                    <ul>
                        <li>L&#x27;adresse email de votre compte Tope-l&#xE0;</li>
                        <li>Si pertinent, une capture de l&#x27;&#xE9;cran quand le probl&#xE8;me se pose</li>
                        <li>D&#xE9;crire ce que vous cherchiez &#xE0; accomplir</li>
                        <li>Si ce n&#x27;est pas &#xE9;vident avec les captures d&#x27;&#xE9;cran, ce que vous obtenez &#xE0; la place de votre objectif</li>
                    </ul>
                    </Typography>
            </Box>
        </>
    </ClientLayout>
}

export default () => <Suspense>
    <Support />
</Suspense>