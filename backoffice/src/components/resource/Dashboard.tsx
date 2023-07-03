import { Box } from "@mui/material"
import Suggestions from "./Suggestions"
import MyResources from "./MyRessources"
import Network from "../user/Network"

const Dashboard = () => {
    return <Box display="flex" flexDirection="column" alignContent="center">
        <Box display="flex" flexDirection="row" justifyContent="space-between" gap="1rem">
            <Box display="flex" flexDirection="column" flex="1 1 50%">
                <Network />
                <Suggestions />
            </Box>
            <Box flex="1 1 50%">
                <MyResources />
            </Box>
        </Box>
    </Box>
}

export default Dashboard