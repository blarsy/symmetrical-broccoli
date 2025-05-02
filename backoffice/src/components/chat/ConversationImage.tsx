import { Box } from "@mui/material"
import { makePxSize, screenSizesCoefficients, ResponsiveImage, ResponsivePhotoBox, AccountAvatar } from "../misc"

interface ConversationImageProps {
    accountName: string
    accountImagePublicId?: string
    resourceImagePublicId?: string
}

const ConversationImage = (p: ConversationImageProps) => {
    const baseSize = 75
    const totalSize = baseSize * 1.5
    return <Box sx={theme => ({ 
            position: 'relative', 
            flex: `0 0 ${makePxSize(totalSize)}`, height: makePxSize(totalSize),
            [theme.breakpoints.down('lg')]: {
                flex: `0 0 ${makePxSize(totalSize, screenSizesCoefficients[0])}`, 
                height: makePxSize(totalSize, screenSizesCoefficients[0]),
            },
            [theme.breakpoints.down('md')]: {
                flex: `0 0 ${makePxSize(totalSize, screenSizesCoefficients[1])}`, 
                height: makePxSize(totalSize, screenSizesCoefficients[1]),
            },
            [theme.breakpoints.down('sm')]: {
                flex: `0 0 ${makePxSize(totalSize, screenSizesCoefficients[2])}`, 
                height: makePxSize(totalSize, screenSizesCoefficients[2]),
            }
        })}>
        <ResponsiveImage baseSize={baseSize} publicId={p.resourceImagePublicId}/>
        <ResponsivePhotoBox baseSize={baseSize} style={theme => {
            const delta = baseSize / 3
            return { 
                position: 'absolute',
                top: makePxSize(delta, 1),
                left: makePxSize(delta, 1),
                [theme.breakpoints.down('lg')]: {
                    top: makePxSize(delta, screenSizesCoefficients[0]),
                    left: makePxSize(delta, screenSizesCoefficients[0])
                },
                [theme.breakpoints.down('md')]: {
                    top: makePxSize(delta, screenSizesCoefficients[1]),
                    left: makePxSize(delta, screenSizesCoefficients[1])
                },
                [theme.breakpoints.down('sm')]: {
                    top: makePxSize(delta, screenSizesCoefficients[2]),
                    left: makePxSize(delta, screenSizesCoefficients[2])
                }
            }
        }}>
            <AccountAvatar avatarImagePublicId={p.accountImagePublicId} name={p.accountName} />
        </ResponsivePhotoBox>
    </Box>
}

export default ConversationImage