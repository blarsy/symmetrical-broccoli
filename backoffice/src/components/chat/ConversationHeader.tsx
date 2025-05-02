import { SxProps } from "@mui/system"
import { ConversationDisplayData } from "./lib"
import ConversationImage from "./ConversationImage"
import { Stack, Theme, Typography } from "@mui/material"

interface Props {
    data: ConversationDisplayData
    sx?: SxProps<Theme>
}

const ConversationHeader = (p: Props) => {
    const resourceImagePublicId = p.data.resource?.images && p.data.resource?.images.length > 0 ? p.data.resource?.images[0].publicId : undefined
    return <Stack direction="row" sx={[{
            padding: '0.5rem'
        }, ...(Array.isArray(p.sx) ? p.sx : [p.sx])]}>
            <ConversationImage accountName={p.data.otherAccount.name} 
                accountImagePublicId={p.data.otherAccount.imagePublicId} resourceImagePublicId={resourceImagePublicId} />
            <Stack>
            <Typography variant="overline" color="primary">{p.data.otherAccount.name}</Typography>
            <Typography variant="caption" color="primary">{p.data.resource?.title}</Typography>
        </Stack>
    </Stack>
}

export default ConversationHeader