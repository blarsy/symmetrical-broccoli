import { Box, Link, Typography } from "@mui/material"
import ResourcesList from "./ResourcesList"

const MyResources = () => {
    return <Box display="flex" flexDirection="column" alignItems="center">
        <Typography variant="h2">Mes ressources</Typography>
        <Link variant="button" href="/home/resource/create">Créer</Link>
        <ResourcesList />
    </Box>
}

export default MyResources