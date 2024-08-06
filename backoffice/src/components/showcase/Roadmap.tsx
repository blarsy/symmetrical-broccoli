import { Timeline, TimelineConnector, TimelineContent, TimelineDot, TimelineItem, TimelineOppositeContent, TimelineSeparator, timelineOppositeContentClasses } from "@mui/lab"
import { SectionTitle } from "./uiLib"
import { Typography } from "@mui/material"
import { lightPrimaryColor } from "@/utils"
import Check from '@mui/icons-material/Check'

const RoadmapContent = ({ title, description }: { title: string, description: string }) => <TimelineContent sx={{ paddingBottom: '3rem' }}>
    <Typography variant="subtitle1">{title}</Typography>
    <Typography variant="body1">{description}</Typography>
</TimelineContent>

const RoadmapSeparator = ({future}: { future?: boolean }) => <TimelineSeparator color={lightPrimaryColor}>
    <TimelineDot color="secondary">
        {future ? <></> : <Check/> }
    </TimelineDot>
    <TimelineConnector color={ future ? 'red' : 'green'} />
</TimelineSeparator>

interface RoadmapItemProps {
    title: string
    description: string
    time: string
    future?: boolean
}

const RoadmapItem = ({ title, description, time, future }: RoadmapItemProps) => <TimelineItem>
    <TimelineOppositeContent>{time}</TimelineOppositeContent>
    <RoadmapSeparator future={future} />
    <RoadmapContent title={title} description={description} />
</TimelineItem>

export default () => <>
    <SectionTitle left title="Feuille de route" />
    <Timeline>
        <RoadmapItem title="Version Alpha" description="Création de compte et de ressources, messagerie instantanée" time="Avril 2024" />
        <RoadmapItem title="Version Béta" description="Customisation des comptes, notifications de messages instantanés et de nouvelles ressources" time="Août 2024" />
        <RoadmapItem future title="Modèle économique" description="Une rémunération juste pour la plate-forme, collectée de manière équitable" time="Septembre 2024 ?" />
        <RoadmapItem future title="Campagne de lancement" description="Un subside à l'économie circulaire 100% démocratique ?" time="Octobre 2024 ?" />
        <RoadmapItem future title="Collectivisation" description="Tope-là devient progressivement un projet entièrement auto-géré par ses utilisateurs" time="Novembre 2024 ?" />
    </Timeline>
</>