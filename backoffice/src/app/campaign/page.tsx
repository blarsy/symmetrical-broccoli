"use client"
import { Box, Container, Divider, Stack, Typography } from "@mui/material"
import Themed from "@/components/scaffold/Themed"
import { PropsWithChildren } from "react"
import CampaignImg from '@/app/img/campaign.svg'
import Coin from '@/app/img/COIN.svg'
import Airdrop from '@/app/img/airdrop.svg'
import Spare from '@/app/img/money-in.svg'

const Paragraph = (p : PropsWithChildren) => <Typography variant="body1" sx={{ paddingBottom: '0.5rem' }}>{p.children}</Typography>
const CustomDivider = () => <Divider sx={{ margin: '0.5rem', borderBottomWidth: 'medium' }} />
const BulletList = ({texts, listStyleType} : { texts: string[], listStyleType?: string }) => <ul style={{ marginLeft: '4rem', listStyleType }}>
    { texts.map((t, idx) => <li key={idx} style={{ paddingLeft: '0.5rem' }}><Paragraph>{t}</Paragraph></li>) }
</ul>

const Campaign = () => {
    return <Themed>
        <Container maxWidth="xl" sx={{ height: '100vh'}}>
            <Box display="flex" flexDirection="column" flex="1" justifyContent="flex-start" paddingTop="2rem">
                <Stack alignItems="center">
                    <CampaignImg/>
                </Stack>
                <Typography textAlign="center" variant="h1">Campagnes d’échange Tope-là </Typography>
                <Typography variant="subtitle1">Un système simple pour échanger, valoriser vos talents, et garder vos euros pour autre chose</Typography>
                <Typography variant="h2">C’est quoi une campagne d’échange ?</Typography>
                <Paragraph>Les campagnes d’échange sont des périodes spéciales dans Tope-là où la communauté d’artisans, d’artistes et d’habitants se mobilise pour échanger davantage.</Paragraph>
                <CustomDivider/>
                <Paragraph>Pendant une campagne, vous pouvez proposer :</Paragraph>
                <BulletList listStyleType="'\1F31F'" texts={['votre savoir-faire,', 'du matériel à louer,', 'des objets en excédent,', 'ou simplement des choses inutilisées qui peuvent servir à d’autres.']} />
                <CustomDivider/>
                <Paragraph>Chaque campagne a un thème clair :</Paragraph>
                <BulletList listStyleType="'\1F449'" texts={[
                    'un moment de l’année (rentrée, Noël, été…)',    
                    'une zone géographique (habitants de Maubray…)',    
                    'un type d’objet (BD, mangas, artisanat…)',    
                    'un type de service (réparation, jardinage, graphisme…)',    
                    'un type de matériel (outils, matériel photo, instruments…)',    
                    'ou une combinaison de tout cela.']} />
                <Typography variant="h2">Comment ça marche ?</Typography>
                <Typography variant="h3">1) Vous créez vos ressources</Typography>
                <Paragraph>Proposez ce que vous savez faire, ce que vous pouvez prêter, louer, ou échanger.</Paragraph>
                <Paragraph>Vous fixez vous-même le prix en Topes.</Paragraph>
                <Stack direction="row" alignItems="center" gap="1rem">
                    <span>1 Tope</span>
                    <Coin height="2rem" width="2rem" />
                    <span>= 1 €cent</span>
                </Stack>
                <Paragraph>Si votre ressource correspond au thème, cochez simplement l’option “Conforme à la campagne”. Il n’y a pas encore de validation automatique — c’est basé sur la description du thème.</Paragraph>
                <Paragraph>Pendant la campagne, vous gagnez des bonus de préparation :</Paragraph>
                <BulletList listStyleType="'\1F381'" texts={[
                    'Création d’une ressource : +20 Topes × le multiplicateur de campagne (souvent ×5 ou ×10)',    
                    'Ajout d’une photo : +5 Topes × le multiplicateur',    
                    'Fixation du prix : +5 Topes × le multiplicateur']} />
                <Paragraph>Ces bonus vous aident à démarrer avec plus de monnaie interne.</Paragraph>
                <CustomDivider/>
                <Typography variant="h3">2) Le jour du largage : vous recevez un gros paquet de Topes</Typography>
                <Stack alignItems="center" paddingBottom="1rem">
                    <Airdrop />
                </Stack>
                <Paragraph>À une date et une heure précises, tous les comptes ayant au moins 2 ressources conformes et prêtes à l’échange reçoivent un largage :</Paragraph>
                <Paragraph>entre 3 000 et 8 000 Topes par personne</Paragraph>
                <Paragraph>(les Topes sont créés ex nihilo pour stimuler les échanges)</Paragraph>
                <Paragraph>C’est le top départ : après le largage, les échanges décollent vraiment.</Paragraph>
                <CustomDivider/>
                <Typography variant="h3">3) Vous échangez avec les autres sans dépenser d’euros</Typography>
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
                <Paragraph>À chaque échange, Tope-là reçoit une petite commission de 10%, qui permet de financer le projet. Vous ne devez pas la payer, elle est créée par le système.</Paragraph>
                <Typography variant="h2">Pourquoi participer ?</Typography>
                <Typography variant="subtitle1">Pour multiplier les échanges locaux</Typography>
                <Paragraph>Vous trouvez ce dont vous avez besoin grâce aux talents et aux ressources des gens autour de vous.</Paragraph>
                <Typography variant="subtitle1">Pour valoriser votre savoir-faire, votre matériel ou vos objets</Typography>
                <Paragraph>Tout le monde a quelque chose à proposer : une compétence, un outil, un objet inutilisé…</Paragraph>
                <Typography variant="subtitle1">Pour gagner rapidement des Topes lors des campagnes</Typography>
                <Paragraph>Les largages vous donnent l’élan nécessaire pour vraiment profiter du système.</Paragraph>
                <Typography variant="subtitle1">Pour jouer l’entraide locale et garder vos euros là où ils sont indispensables</Typography>
                <Paragraph>C’est un jeu économique local :</Paragraph>
                <BulletList listStyleType="'\1F308'" texts={[
                    'combler nos besoins ensemble,',
                    'grâce à l’entraide et la créativité,',
                    'et garder nos euros là où ils sont indispensables.',
                ]} />
            </Box>
        </Container>
    </Themed>
}

export default Campaign