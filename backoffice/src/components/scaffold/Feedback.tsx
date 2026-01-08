import { Alert, AlertColor, Stack, SxProps, Theme, Tooltip, Typography } from "@mui/material"
import InfoIcon from '@mui/icons-material/Info'
import { useContext } from "react"
import { UiContext } from "./UiContextProvider"
import { p } from "graphql-ws/dist/common-DY-PBNYy"

interface Props {
    message?: string
    detail?: string
    severity: AlertColor
    onClose?: () => void
    visible?: boolean
    sx?: SxProps<Theme>
    testID?: string
}

const Feedback = ({ message, detail, severity, onClose, sx, testID, visible = true }: Props) => {
    const uiContext = useContext(UiContext)
    if(!message) message = uiContext.i18n?.translator('requestError')

    if(visible) {
        return <Alert sx={sx} severity={severity} onClose={onClose}>
            <Stack>
                <Stack direction="row" justifyItems="space-between" gap="1rem" data-testid={testID}>
                    <Typography data-testid={`${testID}:Message`}>{message}</Typography>
                    {detail && <Tooltip title={detail}>
                        <InfoIcon/>
                    </Tooltip>}
                </Stack>
            </Stack>
        </Alert>
    }
}

export default Feedback