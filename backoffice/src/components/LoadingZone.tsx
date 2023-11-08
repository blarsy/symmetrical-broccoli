import DataLoadState from "@/DataLoadState"
import { Box, CircularProgress } from "@mui/material"
import Feedback from "./Feedback"

interface Props<T> {
    children: JSX.Element
    loadState: DataLoadState<T>
    onErrorClosed: () => void
}
function LoadingZone<M> ({ children, loadState, onErrorClosed}: Props<M>) {
    let content: JSX.Element = <></>
    if(loadState.loading) content = <Box display="flex" flexDirection="column" alignItems="center" margin="1rem"><CircularProgress /></Box>
    else {
        if(loadState.data) {
            content = children
        } else if(loadState.error) {
            content = <Feedback message={loadState.error.message!} detail={loadState.error.detail} severity="error"
            onClose={() => onErrorClosed()} />
        }
    }
    return <Box sx={{ display:'flex', flexDirection: 'column', alignSelf: 'stretch', gap: '0.5rem', flex: 1 }}>
        {content}
    </Box>
}

export default LoadingZone