import { Tooltip, Typography } from "@mui/material"
import { Message } from "./lib"
import { Stack } from "@mui/system"
import { useContext, useEffect, useRef } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { lightPrimaryColor, primaryColor } from "@/utils"
import dayjs from "dayjs"

interface Props {
    data: Message[]
}

const friendlyTime = (time: Date) => {
    if(dayjs(new Date()).diff(time, 'hours') < 24) {
        return dayjs(time).format('HH:mm:ss')
    } else if(dayjs(new Date()).diff(time, 'years') < 1) {
        return dayjs(time).format('DD MMM HH:mm')
    } else {
        return dayjs(time).format('DD MMM YYYY HH:mm')
    }
}

const ConversationMessages = (p: Props) => {
    const appContext = useContext(AppContext)
    const endRef = useRef<null | HTMLDivElement>(null)

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [])

    return <Stack gap="0.5rem" padding="0.5rem" overflow="auto" flex="1">
        {p.data.map((msg, idx) => {
            const isMessageFromMe = msg.user.id === appContext.account!.id
            return <Stack key={idx} direction="row" justifyContent={isMessageFromMe ? 'flex-end' : 'flex-start'}>
                <Tooltip title={friendlyTime(msg.createdAt)} placement="left-end">
                    <Typography variant="body2" 
                        maxWidth="65%"
                        sx={{ backgroundColor: isMessageFromMe ? primaryColor : lightPrimaryColor }}
                        borderRadius="1rem"
                        color={isMessageFromMe ? '#fff' : '#000'}
                        textAlign={isMessageFromMe ? 'right': 'left'} 
                        alignSelf={isMessageFromMe ? 'flex-end': 'flex-start'}
                        padding="0.5rem">
                        {msg.text}
                    </Typography>
                </Tooltip>
            </Stack>
        } )}
        <div ref={endRef}/>
    </Stack>
}

export default ConversationMessages