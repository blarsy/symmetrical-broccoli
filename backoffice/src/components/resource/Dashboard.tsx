import { Box } from "@mui/material"
import Suggestions from "./Suggestions"
import MyResources from "./MyRessources"

const Dashboard = () => {
    return <Box display="flex" flexDirection="column" alignContent="center">
        <Box display="flex" flexDirection="row" justifyContent="space-between">
            <Suggestions />
            <MyResources />
        </Box>
    </Box>
}

export default Dashboard