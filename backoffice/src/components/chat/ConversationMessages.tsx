import { IconButton, Tooltip, Typography } from "@mui/material"
import { Message } from "./lib"
import { Stack } from "@mui/system"
import { useContext, useEffect, useRef } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { lightPrimaryColor, primaryColor } from "@/utils"
import dayjs from "dayjs"
import KeyboardDoubleArrowDownIcon from '@mui/icons-material/KeyboardDoubleArrowDown'
import ChatIcon from '@mui/icons-material/MarkUnreadChatAlt'

const friendlyTime = (time: Date) => {
    if(dayjs(new Date()).diff(time, 'hours') < 24) {
        return dayjs(time).format('HH:mm:ss')
    } else if(dayjs(new Date()).diff(time, 'years') < 1) {
        return dayjs(time).format('DD MMM HH:mm')
    } else {
        return dayjs(time).format('DD MMM YYYY HH:mm')
    }
}

interface Props {
    data: Message[]
    hasNew: boolean
    onBottom: () => void
}

const ConversationMessages = ((p: Props) => {
    const appContext = useContext(AppContext)
    const endRef = useRef<null | HTMLDivElement>(null)
    const messageLisRef = useRef<null | HTMLDivElement>(null)

    const isBottom = (el: Element) => {
        console.log(Math.abs(el.scrollHeight - (el.scrollTop + el.clientHeight)))
        return Math.abs(el.scrollHeight - (el.scrollTop + el.clientHeight)) <= 50
    }

    const scrollToBottom = () => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
        p.onBottom()
    }

    useEffect(() => {
        scrollToBottom()
    }, [])

    useEffect(() => {
        if(p.hasNew && messageLisRef.current && isBottom(messageLisRef.current)) {
            scrollToBottom()
        }
    }), [p.hasNew]

    return <Stack ref={messageLisRef} gap="0.5rem" padding="0.5rem" overflow="auto" flex="1" onScroll={e => {
            if(isBottom(e.currentTarget)) {
                p.onBottom()
            }
        }}>
        <Stack position="relative">
            {p.data.map((msg, idx) => {
                const isMessageFromMe = msg.user.id === appContext.account!.id
                return <Stack key={idx}>
                    <Stack direction="row" justifyContent={isMessageFromMe ? 'flex-end' : 'flex-start'}>
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
                </Stack>
            } )}
            { p.hasNew && <Stack position="fixed" bottom="4rem" right="2rem" justifyContent="center">
                <IconButton sx={theme => ({ 
                    backgroundColor: theme.palette.secondary.main, 
                    color: theme.palette.primary.contrastText,
                    '&:hover': {
                        backgroundColor: theme.palette.primary.main
                    }
                })} size="large" onClick={scrollToBottom}>
                    <Stack position="relative">
                        <ChatIcon />
                        <KeyboardDoubleArrowDownIcon />
                    </Stack>
                </IconButton>
            </Stack>}
        </ Stack>
        <div ref={endRef}/>
    </Stack>
})

export default ConversationMessages