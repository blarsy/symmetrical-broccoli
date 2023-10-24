import { Resource } from "@/schema"
import { Box, Card, Stack, Tooltip, Typography } from "@mui/material"
import dayjs from "dayjs"
import Image from "next/image"

const imagePublicBaseUrl = process.env.NEXT_PUBLIC_IMG_URL

interface Props {
    resource: Resource,
    onClick: () => void
}

const ResourceCard = ({ resource, onClick }: Props) => <Card component={Box} display="flex" flexDirection="row" gap="1rem" alignItems="center" onClick={onClick}>
    { resource.images && resource.images.length > 0 ? 
            <Image width="100" height="100" src={`${imagePublicBaseUrl}/${resource.images[0].path}`} alt={resource.title} /> :
            <Image width="100" height="100" src="/placeholder.png" alt="pas d'image" />
    }
    <Tooltip title={resource.description}>
        <Stack>
            <Typography variant="body1">Proposé par {resource.account!.name}</Typography>
            <Typography variant="overline">{resource.title}</Typography>
            <Typography variant="body1">Expire {dayjs(resource.expiration).fromNow()} ({dayjs(resource.expiration).format('DD/MM/YYYY HH:mm')})</Typography>
        </ Stack>
    </Tooltip>
</Card>

export default ResourceCard