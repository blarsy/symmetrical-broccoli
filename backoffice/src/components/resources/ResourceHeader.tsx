import { SxProps } from "@mui/system"
import { ResourceHeaderyData } from "../chat/lib"
import ResourceImage from "../ResourceImage"
import { Stack, Theme, Typography } from "@mui/material"

interface Props {
    data: ResourceHeaderyData
    sx?: SxProps<Theme>
    onResourceClicked?: () => void
    onAccountClicked?: () => void
}

const ResourceHeader = (p: Props) => {
    const resourceImagePublicId = p.data.resource?.images && p.data.resource?.images.length > 0 ? p.data.resource?.images[0].publicId : undefined
    return <Stack direction="row" sx={[{
            padding: '0.5rem', gap: '0.5rem'
        }, ...(Array.isArray(p.sx) ? p.sx : [p.sx])]}>
        <ResourceImage accountName={p.data.otherAccount.name} baseWidth={120}
            accountImagePublicId={p.data.otherAccount.imagePublicId} resourceImagePublicId={resourceImagePublicId} 
            avatarImageUrl={p.data.otherAccount.avatarImageUrl} onResourceClicked={p.onResourceClicked} 
            onAccountClicked={p.onAccountClicked} />
        <Stack>
            <Typography variant="overline" color="primary">{p.data.otherAccount.name}</Typography>
            <Typography variant="caption" color="primary">{p.data.resource?.title}</Typography>
        </Stack>
    </Stack>
}

export default ResourceHeader