import DataLoadState from "@/app/DataLoadState"
import { Box, CircularProgress, Paper, Typography } from "@mui/material"
import Feedback from "./Feedback"

interface Props<T> {
    displayItem: (item: T) => JSX.Element,
    loadState: DataLoadState<T[]>,
    onErrorClosed: () => void
}
function LoadingList<M> ({ displayItem, loadState, onErrorClosed}: Props<M>) {
    let content: JSX.Element
    if(loadState.loading) content = <Box display="flex" flexDirection="column" alignItems="center" margin="1rem"><CircularProgress /></Box>
    else {
        if(loadState.data) {
            if(loadState.data.length === 0){
                content = <Typography padding="1rem" variant="overline" textAlign="center">Aucune donnée trouvée</Typography>
            } else {
                content = <Box>
                    {loadState.data.map((item: M) => displayItem(item))}
                </Box>
            }
        } else {
            content = <Feedback message={loadState.error!.message!} detail={loadState.error!.detail} severity="error"
            onClose={() => onErrorClosed()} />
        }
    }
    return <Box sx={{ display:'flex', flexDirection: 'column', alignSelf: 'stretch', gap: '0.5rem' }}>
        {content}
    </Box>
}

export default LoadingList