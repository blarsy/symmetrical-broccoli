import { Box, Link, Typography } from "@mui/material"
import ResourcesList from "./ResourcesList"
import NextLink from 'next/link'

const MyResources = () => {
    return <Box display="flex" flexDirection="column" alignItems="center" flex={1}>
        <Typography variant="h2">Mes ressources</Typography>
        <Link variant="button" component={NextLink} href="/home/resource/create">Créer</Link>
        <ResourcesList />
    </Box>
}

export default MyResources