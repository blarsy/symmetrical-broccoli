import { Stack, Typography } from "@mui/material"
import dayjs from "dayjs"
import HourglassRemaining from "@mui/icons-material/HourglassTop"
import HourGlassElapsed from '@mui/icons-material/HourglassBottom'
import { useContext } from "react"
import { UiContext } from "../scaffold/UiContextProvider"

const ExpirationIndicator = ({ value }: { value?: Date }) => {
    const uiContext = useContext(UiContext)
    const typedDate = typeof value === 'string' ? new Date(value) : value
    let content

    if(typedDate) {
        if(typedDate > new Date()) {
            content = [
                <HourglassRemaining key="icon"/>,
                <Typography key="text" variant="body1">
                    { dayjs().to(dayjs(typedDate)) }
                </Typography>
            ]
        } else {
            content =             [
                <HourGlassElapsed key="icon" />,
                <Typography key="text" variant="body1">
                    { uiContext.i18n.translator('expired')}
                </Typography>
            ]
        }
    } else {
        content = <Typography key="text" variant="body1"> { uiContext.i18n.translator('doesNotExpire') }</Typography>
    }

    return <Stack flexDirection="row" alignItems="center">
        {content}
    </Stack>
}

export default ExpirationIndicator