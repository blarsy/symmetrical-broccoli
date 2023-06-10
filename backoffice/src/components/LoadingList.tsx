import DataLoadState from "@/app/DataLoadState"
import { Box, CircularProgress, Paper, Typography } from "@mui/material"
import Feedback from "./Feedback"

interface Props {
    displayItem: (item: any) => JSX.Element,
    loadState: DataLoadState,
    onErrorClosed: () => void
}
const LoadingList = ({ displayItem, loadState, onErrorClosed}: Props) => {
    let content: JSX.Element
    if(loadState.loading) content = <Box display="flex" flexDirection="column" alignItems="center" margin="1rem"><CircularProgress /></Box>
    else {
        if(loadState.data) {
            if(loadState.data.length === 0){
                content = <Typography padding="1rem" variant="overline" textAlign="center">Aucune donnée trouvée</Typography>
            } else {
                content = loadState.data.map((item: any) => displayItem(item))
            }
        } else {
            content = <Feedback message={loadState.error.message!} detail={loadState.error.detail} severity="error"
            onClose={() => onErrorClosed()} />
        }
    }
    return <Paper sx={{ display:'flex', padding: '1rem', flexDirection: 'column', alignSelf: 'stretch' }}>
        {content}
    </Paper>
}

export default LoadingList