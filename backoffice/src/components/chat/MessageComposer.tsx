import { CircularProgress, Dialog, IconButton, Stack, TextField, useTheme } from "@mui/material"
import { ResourceHeaderData } from "./lib"
import ImageIcon from '@/app/img/PHOTOS.svg?react'
import { useContext, useState } from "react"
import ImageUpload from "../user/ImageUpload"
import Send from '@mui/icons-material/Send'
import { gql, useMutation } from "@apollo/client"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { UiContext } from "../scaffold/UiContextProvider"

export const CREATE_MESSAGE = gql`mutation CreateMessage($text: String, $resourceId: UUID, $otherAccountId: UUID, $imagePublicId: String) {
    createMessage(
      input: {imagePublicId: $imagePublicId, resourceId: $resourceId, otherAccountId: $otherAccountId, text: $text}
    ) {
      uuid
    }
  }`


interface Props {
    conversation: ResourceHeaderData
    onMessageSent: (id: string, text: string, imagePublicId?: string) => void
}

const MessageComposer = (p: Props) => {
    const [pickingImage, setPickingImage] = useState(false)
    const [draftMessage, setDraftMessage] = useState('')
    const theme = useTheme()
    const [createMessage] = useMutation(CREATE_MESSAGE)
    const [sendMessageStatus, setSendMessageStatus] = useState(initial<undefined>(false))
    const uiContext = useContext(UiContext)

    const sendMessage = async (message: string, imagePublicId?: string) => {
        if(!message && !imagePublicId) return
        setSendMessageStatus(initial(true))
        try {
            const res = await createMessage({ variables: { 
                text: message,
                resourceId: p.conversation.resource!.id, 
                otherAccountId: p.conversation.otherAccount.id,
                imagePublicId } })
            setSendMessageStatus(fromData(undefined))
            setDraftMessage('')
            p.onMessageSent(res.data.createMessage.uuid, message, imagePublicId)
        } catch(e) {
            setSendMessageStatus(fromError(e, uiContext.i18n.translator('requestError')))
        }
    }

    return <Stack direction="row" alignItems="center" sx={{ borderTop: '1px solid #aaa' }}>
        <IconButton sx={{ width: '3rem', height: '3rem' }} onClick={() => {
            setPickingImage(true)
        }}><ImageIcon fill={theme.palette.primary.main} /></IconButton>
        <TextField multiline size="small" sx={{ flex: 1 }} onChange={e => setDraftMessage(e.currentTarget.value)} value={draftMessage} />
        <IconButton onClick={async () => {
            sendMessage(draftMessage)
        }}>
            { sendMessageStatus.loading ?
                <CircularProgress color="primary" size="3rem" />
                :
                <Send color="primary" />
            }
        </IconButton>
        <Dialog open={pickingImage} onClose={() => setPickingImage(false)} sx={{ margin: '1rem', flexDirection: 'column', alignItems: 'center' }}>
            <ImageUpload onUploaded={async publicId => {
                await sendMessage('', publicId)
                setPickingImage(false)
            }} />
        </Dialog>
    </Stack>
}

export default MessageComposer