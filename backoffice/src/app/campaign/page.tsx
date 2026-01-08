"use client"
import { Box, Container, Divider, Stack, Typography } from "@mui/material"
import Themed from "@/components/scaffold/Themed"
import { PropsWithChildren } from "react"
import CampaignImg from '@/app/img/campaign.svg?react'
import Airdrop from '@/app/img/airdrop.svg?react'
import Spare from '@/app/img/money-in.svg?react'

const Paragraph = (p : PropsWithChildren) => <Typography variant="body1" sx={{ paddingBottom: '0.5rem' }}>{p.children}</Typography>
const CustomDivider = () => <Divider sx={{ margin: '0.5rem', borderBottomWidth: 'medium' }} />
const BulletList = ({texts, listStyleType} : { texts: string[], listStyleType?: string }) => <ul style={{ marginLeft: '4rem', listStyleType }}>
    { texts.map((t, idx) => <li key={idx} style={{ paddingLeft: '0.5rem' }}><Paragraph>{t}</Paragraph></li>) }
</ul>

const Campaign = () => {
    return <Themed>
        <Container maxWidth="md" sx={{ height: '100vh'}}>
            <Box display="flex" flexDirection="column" flex="1" justifyContent="flex-start" paddingTop="2rem">
                <Stack alignItems="center">
                    <CampaignImg/>
                </Stack>
                <Typography textAlign="center" variant="h1">Campagnes d’échange Tope-là </Typography>
                <Typography variant="subtitle1">Un système simple pour échanger, valoriser vos talents, et créer du lien.</Typography>
                <Typography variant="h2">C’est quoi une campagne d’échange ?</Typography>
                <Paragraph>Les campagnes d’échange sont des périodes spéciales dans Tope-là où la communauté d’artisans, d’artistes et d’habitants se mobilise pour échanger davantage.</Paragraph>
                <CustomDivider/>
                <Paragraph>Pendant une campagne, vous pouvez proposer :</Paragraph>
                <BulletList listStyleType="'\1F31F'" texts={['votre savoir-faire,', 'du matériel à louer,', 'des objets en excédent,', 'ou simplement des choses inutilisées qui peuvent servir à d’autres.']} />
                <CustomDivider/>
                <Paragraph>Chaque campagne a un thème clair :</Paragraph>
                <BulletList listStyleType="'\1F449'" texts={[
                    'un moment de l’année (rentrée, Noël, été…)',    
                    'une zone géographique (habitants d\'un quartier…)',    
                    'un type d’objet (BD, mangas, artisanat…)',    
                    'un type de service (réparation, jardinage, graphisme…)',    
                    'un type de matériel (outils, matériel photo, instruments…)',    
                    'ou une combinaison de tout cela.']} />
                <Typography variant="h2">Comment ça marche ?</Typography>
                <Typography variant="h3">1) Vous créez vos ressources</Typography>
                <Paragraph>Proposez ce que vous savez faire, ce que vous pouvez prêter, louer, ou échanger.</Paragraph>
                <Paragraph>Proposez une contrepartie en Topes.</Paragraph>
                <Paragraph>Si votre ressource correspond au thème, cochez simplement l’option “Conforme à la campagne”.</Paragraph>
                <Paragraph>Pendant la campagne, vous gagnez des bonus de préparation :</Paragraph>
                <BulletList listStyleType="'\1F381'" texts={[
                    'Création d’une ressource : +20 Topes × le multiplicateur de campagne (souvent ×5 ou ×10)',    
                    'Ajout d’une photo : +5 Topes × le multiplicateur',    
                    'Proposition d\'une contrepartie : +5 Topes × le multiplicateur']} />
                <Paragraph>Ces bonus vous aident à démarrer avec plus de jetons d'échange interne.</Paragraph>
                <CustomDivider/>
                <Typography variant="h3">2) Le jour du largage : vous recevez un gros paquet de Topes</Typography>
                <Stack alignItems="center" paddingBottom="1rem">
                    <Airdrop />
                </Stack>
                <Paragraph>À une date et une heure précises, tous les comptes ayant au moins 2 ressources conformes et prêtes à l’échange reçoivent un largage :</Paragraph>
                <Paragraph>entre 3 000 et 8 000 Topes par personne (ça dépend chaque campagne)</Paragraph>
                <Paragraph>(les Topes sont créés pour stimuler les échanges)</Paragraph>
                <Paragraph>C’est le top départ : après le largage, les échanges décollent vraiment.</Paragraph>
                <CustomDivider/>
                <Typography variant="h3">3) Vous échangez avec les autres</Typography>
                <Stack alignItems="center" paddingBottom="1rem">
                    <Spare />
                </Stack>
                <Paragraph>Avec vos Topes, vous pouvez obtenir :</Paragraph>
                <BulletList listStyleType="'\1F4A5'" texts={[
                    'des services locaux,',
                    'du matériel,',
                    'des objets utiles,',
                    'des créations artisanales,',
                    'des coups de main,',
                    'et tout ce que la communauté propose.',
                ]} />
                <Paragraph>À chaque échange, Tope-là reçoit une petite dodation de 10%, qui permet de financer le projet. Vous ne devez pas la payer, elle est créée par le système.</Paragraph>
                <Typography variant="h2">Pourquoi participer ?</Typography>
                <Typography variant="subtitle1">Pour multiplier les échanges locaux</Typography>
                <Paragraph>Vous trouvez ce dont vous avez besoin grâce aux talents et aux ressources des gens autour de vous.</Paragraph>
                <Typography variant="subtitle1">Pour valoriser votre savoir-faire, votre matériel ou vos objets</Typography>
                <Paragraph>Tout le monde a quelque chose à proposer : une compétence, un outil, un objet inutilisé…</Paragraph>
                <Typography variant="subtitle1">Pour gagner rapidement des Topes lors des campagnes</Typography>
                <Paragraph>Les largages vous donnent l’élan nécessaire pour vraiment profiter du système.</Paragraph>
                <Typography variant="subtitle1">Pour jouer l’entraide locale, que vous ayez on non de l'argent.</Typography>
                <Paragraph>C’est un jeu économique local :</Paragraph>
                <BulletList listStyleType="'\1F308'" texts={[
                    'combler nos besoins ensemble,',
                    'grâce à l’entraide et la créativité,',
                    'et créer des liens solides.',
                ]} />
            </Box>
        </Container>
    </Themed>
}

export default Campaign