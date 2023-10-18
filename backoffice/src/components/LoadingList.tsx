import DataLoadState from "@/DataLoadState"
import { Box, CircularProgress, List, ListItem, ListItemButton, ListItemText, Paper, Typography } from "@mui/material"
import Feedback from "./Feedback"
import { MouseEventHandler } from "react"
import LoadingZone from "./LoadingZone"

interface Props<T> {
    displayItem: (item: T) => string | JSX.Element,
    loadState: DataLoadState<T[]>,
    onErrorClosed: () => void,
    onSelect?: (item: T) => void
}
function LoadingList<M> ({ displayItem, loadState, onErrorClosed, onSelect}: Props<M>) {
    let content: JSX.Element= <Box></Box>

    if(loadState.data) {
        if(loadState.data.length === 0){
            content = <Typography padding="1rem" variant="overline" textAlign="center">Aucune donnée trouvée</Typography>
        } else {
            content = <List dense={true}>
                {loadState.data.map((item: M, idx) => <ListItem key={idx} disablePadding>
                    <ListItemButton onClick={() => onSelect && onSelect(item)}>
                        <ListItemText>{displayItem(item)}</ListItemText>
                    </ListItemButton>
                </ListItem>)}
            </List>
        }
    }

    return <LoadingZone loadState={loadState} onErrorClosed={onErrorClosed}>
        { content }
    </LoadingZone>
}

export default LoadingList