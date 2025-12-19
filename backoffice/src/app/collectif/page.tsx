"use client"
import { Box, Container, Divider, Stack, Typography } from "@mui/material"
import Themed from "@/components/scaffold/Themed"
import { PropsWithChildren } from "react"

const Paragraph = (p : PropsWithChildren) => <Typography variant="body1" sx={{ paddingBottom: '0.5rem' }}>{p.children}</Typography>
const CustomDivider = () => <Divider sx={{ margin: '1rem', borderBottomWidth: 'medium' }} />
const BulletList = ({texts, listStyleType} : { texts: string[], listStyleType?: string }) => <ul style={{ marginLeft: '4rem', listStyleType, marginTop: '1rem', marginBottom: '1rem' }}>
    { texts.map((t, idx) => <li key={idx} style={{ paddingLeft: '0.5rem' }}><Paragraph>{t}</Paragraph></li>) }
</ul>

const Collectif = () => {
    return <Themed>
        <Container maxWidth="md" sx={{ height: '100vh'}}>
            <Box display="flex" flexDirection="column" flex="1" justifyContent="flex-start" paddingTop="2rem">
                <Typography textAlign="center" variant="h1">Collectivisation</Typography>
                <Paragraph>Cette page est pour toi si</Paragraph>
                <BulletList listStyleType="'\1F449'" texts={[
                    'tu veux dépasser le statu quo du produire/consommer/dormir',
                    'tu cherches du sens, de la profondeur, à tes actions',
                    'quelque chose te semble coincer dans le militantisme conventionnel, l’associatif conventionnel, ou l’entrepreneuriat conventionnel', 'bref, tu as l’impression d’être décalé(e) par rapport à ton environnement'
                ]} />
                <CustomDivider />
                <Paragraph>La mission de Tope-là est de permettre aux acteurs de la culture, de l’art, de l’artisanat, de l’écologie, de l’éducation et du soin non médical de trouver les outils, matériaux, compétences dont ils ont besoin, grâce à l’échange, au troc, ou au don.</Paragraph>
                <Paragraph>Derrière l’apparente simplicité de cette mission, se trouve un défi de taille : à la fois sortir des logiques marchandes dominantes, et en créer de nouvelles qui fluidifient la circulation des ressources.</Paragraph>
                <CustomDivider />
                <Paragraph>Le bon outil pour cheminer vers ces nouvelles logiques restauratives d’un tissu social cohésif réside dans un type d’organisation encore peu observé, parfois appelé “Organisation Opale”.</Paragraph>
                <Paragraph>Voici les piliers d’une telle organisation :</Paragraph>
                <BulletList listStyleType="'\1FA84'" texts={[
                    'Autogouvernance : Les équipes gèrent leur travail, prennent des décisions sans managers traditionnels, en s\'appuyant sur la consultation des pairs et des experts (processus de sollicitation d\'avis).',
                    'Plénitude : Encourager les collaborateurs à être eux-mêmes (émotions, valeurs, aspirations), favorisant l\'authenticité et réduisant les "masques" sociaux au travail.',
                    'Raison d\'être évolutive : L\'organisation est perçue comme un organisme vivant qui s\'adapte et évolue en fonction d\'une mission collective, plutôt que d\'un but fixe.'
                ]} />
                <CustomDivider />
                <Paragraph>Tope-là voudrait se transformer en une organisation “Opale”.</Paragraph>
                <Paragraph>Concrètement, on utilise des processus de réunion et de collaboration qui respectent ces piliers. On n’a pas peur de sortir des sentiers battus, ni d’utiliser des outils plus classiques, ça dépend toujours de ce qui est ressenti comme juste pour la mission collective, ainsi qu’un sentiment personnel de cohérence.</Paragraph>
                <Paragraph>La seule vraie exigence pour entrer dans cette atmosphère, est de laisser la chance à ces processus de construire une confiance partagée dans le collectif.</Paragraph>
                <Paragraph>Mais on te mentirait si on ne mentionnait pas certains éléments de posture indispensables :</Paragraph>
                <BulletList listStyleType="'\1F3AF'" texts={[
                    'Tu appréhendes le conflit comme une opportunité de découvrir quelque chose dont le collectif a besoin pour accomplir sa mission',
                    'Tu peux vivre avec une quantité d’incertitude plus grande que dans les modèles organisationnels plus connus, et considérer l’incertitude comme un territoire à explorer, pas uniquement comme une source systématique de danger',
                    'Tu as suffisamment travaillé sur tes blessures pour appréhender des situations en étant l’accompagnant de tes émotions et ressentis, plutôt que leur esclave - et bien sûr nous ne sommes pas des machines',
                    'Tu as de l’expérience dans l’une ou l’autre forme de gouvernance partagée, ou au moins une connaissance théorique et un intérêt'
                ]} />
                <CustomDivider />
                <Paragraph>Question compétences, voici une liste - pas forcément exhaustive - de ce dont Tope-là a besoin :</Paragraph>
                <BulletList listStyleType="'\1F9E9'" texts={[
                    'Gardiens de l’expérience utilisateur: pour l’ergonomie, la facilité d’usage, l’intuitivité, le bon fonctionnement de nos créations',
                    'Porte-paroles: communiquer les messages que Tope-là veut faire parvenir, via Internet, ou parfois via les médias traditionnels',
                    'Pôle visuel: mettre en image les outils numériques et les messages de Tope-là, et garder une cohérence qui renforce toutes les qualités de nos créations',
                    'Ambassadeurs: parler de Tope-là, recueillir des retours, observer comment Tope-là est perçue, sentir comment atteindre mieux notre public, entretenir un lien avec les utilisateurs, …',
                    'Artisans numériques: apprendre les outils avec lesquels les créations numériques de Tope-là sont bâties, les adapter, fournir les informations techniques qui influencent les décisions des autres collaborateurs'
                ]} />
                <Paragraph>Chacun de ces rôles a des exigences variables en temps et compétences, qui sont co-créées entre les collaborateurs pour que les attentes soient claires, réalistes en fonction de la situation de chacun, et pertinentes dans le cadre de la mission de Tope-là</Paragraph>
                <CustomDivider />
                <Typography variant="subtitle1">Un mot important sur la contribution et la rémunération</Typography>
                <Paragraph>À ce stade du projet, les contributions à Tope-là ne sont pas rémunérées en euros. L’objectif est de construire d’abord un cadre, des outils et une dynamique collective solides. Des formes de rémunération pourront émerger plus tard — en euros ou via d’autres mécanismes propres à Tope-là — mais il n’y a aucune certitude ni promesse à ce sujet.</Paragraph> 
                <Paragraph>Chacun est donc invité à s’engager uniquement à hauteur de ce qui est juste et soutenable pour lui ou elle, en conscience.</Paragraph>
                <CustomDivider />
                <Stack alignItems="center">
                    <Typography variant="subtitle1" textAlign="center" sx={{ width: '50%', minWidth: '300px', margin: '3rem 0' }}>Si tu sens un élan vers ce contexte, et que tu penses cocher beaucoup de cases, écris-nous à topela.hello@gmail.com, qu’on se rencontre 🙂</Typography>
                </Stack>
            </Box>
        </Container>
    </Themed>
}

export default Collectif