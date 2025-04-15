import { Alert, AlertColor, Stack, Tooltip, Typography } from "@mui/material"
import InfoIcon from '@mui/icons-material/Info'
import { useContext } from "react"
import { AppContext } from "./AppContextProvider"

interface Props {
    message?: string
    detail?: string
    severity: AlertColor
    onClose?: () => void
    visible?: boolean
}

const Feedback = ({ message, detail, severity, onClose, visible = true }: Props) => {
    const appContext = useContext(AppContext)
    if(!message) message = appContext.i18n?.translator('requestError')

    if(visible) {
        return <Alert severity={severity} onClose={onClose}>
            <Stack>
                <Stack direction="row" justifyItems="space-between" gap="1rem">
                    <Typography>{message}</Typography>
                    {detail && <Tooltip title={detail}>
                        <InfoIcon/>
                    </Tooltip>}
                </Stack>
            </Stack>
        </Alert>
    }
}

export default Feedback