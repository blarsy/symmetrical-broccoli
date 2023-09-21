import { Box } from "@mui/material"
import Suggestions from "./Suggestions"

const Dashboard = () => {
    return <Box display="flex" flexDirection="column" alignContent="center">
        <Box display="flex" flexDirection="row" justifyContent="space-between" gap="1rem">
            <Suggestions />
        </Box>
    </Box>
}

export default Dashboard