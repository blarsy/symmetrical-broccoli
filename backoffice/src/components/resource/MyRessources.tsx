import { Box, Link, Typography } from "@mui/material"
import ResourcesList from "./ResourcesList"
import NextLink from 'next/link'
import { useRouter } from "next/navigation"

const MyResources = () => {
    const router = useRouter()
    return <Box display="flex" flexDirection="column" alignItems="center" flex={1}>
        <Typography variant="h2">Mes ressources</Typography>
        <Link variant="button" component={NextLink} href="/home/resource/create">Créer</Link>
        <ResourcesList onEditRequested={res => router.push(`/home/resource/${res.id}`)}/>
    </Box>
}

export default MyResources