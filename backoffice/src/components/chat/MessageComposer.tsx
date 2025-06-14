import { CircularProgress, Dialog, IconButton, Stack, TextField, useTheme } from "@mui/material"
import { ConversationDisplayData } from "./lib"
import ImageIcon from '@/app/img/PHOTOS.svg'
import { useContext, useState } from "react"
import ImageUpload from "../user/ImageUpload"
import Send from '@mui/icons-material/Send'
import { gql, useMutation } from "@apollo/client"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { AppContext } from "../scaffold/AppContextProvider"

export const CREATE_MESSAGE = gql`mutation CreateMessage($text: String, $resourceId: Int, $otherAccountId: Int, $imagePublicId: String) {
    createMessage(
      input: {imagePublicId: $imagePublicId, resourceId: $resourceId, otherAccountId: $otherAccountId, text: $text}
    ) {
      integer
    }
  }`


interface Props {
    conversation: ConversationDisplayData
}

const MessageComposer = (p: Props) => {
    const [pickingImage, setPickingImage] = useState(false)
    const [draftMessage, setDraftMessage] = useState('')
    const theme = useTheme()
    const [createMessage] = useMutation(CREATE_MESSAGE)
    const [sendMessageStatus, setSendMessageStatus] = useState(initial<undefined>(false))
    const appContext = useContext(AppContext)

    const sendMessage = async (message: string, imagePublicId?: string) => {
        setSendMessageStatus(initial(true))
        try {
            await createMessage({ variables: { 
                text: message, 
                resourceId: p.conversation.resource!.id, 
                otherAccountId: p.conversation.otherAccount.id,
                imagePublicId } })
            setSendMessageStatus(fromData(undefined))
        } catch(e) {
            setSendMessageStatus(fromError(e, appContext.i18n.translator('requestError')))
        }
    }

    return <Stack direction="row" alignItems="center" sx={{ borderTop: '1px solid #aaa' }}>
        <IconButton sx={{ width: '3rem', height: '3rem' }} onClick={() => {
            setPickingImage(true)
        }}><ImageIcon fill={theme.palette.primary.main} /></IconButton>
        <TextField size="small" sx={{ flex: 1 }} onChange={e => setDraftMessage(e.currentTarget.value)} value={draftMessage} />
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