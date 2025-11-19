import { Box } from "@mui/material"
import { makePxSize, screenSizesCoefficients, ResponsiveImage, ResponsivePhotoBox, AccountAvatar } from "./misc"

interface ResourceImageProps {
    accountName: string
    accountImagePublicId?: string
    avatarImageUrl?: string
    resourceImagePublicId?: string
    baseWidth: number
    onResourceClicked?: () => void
    onAccountClicked?: () => void
}

const ResourceImage = (p: ResourceImageProps) => {
    const baseSize = p.baseWidth / 1.5
    return <Box sx={theme => ({ 
            position: 'relative', 
            padding: '0.25rem 0 0 0.25rem',
            flex: `0 0 ${makePxSize(p.baseWidth)}`, height: makePxSize(p.baseWidth),
            [theme.breakpoints.down('lg')]: {
                flex: `0 0 ${makePxSize(p.baseWidth, screenSizesCoefficients[0])}`, 
                height: makePxSize(p.baseWidth, screenSizesCoefficients[0]),
            },
            [theme.breakpoints.down('md')]: {
                flex: `0 0 ${makePxSize(p.baseWidth, screenSizesCoefficients[1])}`, 
                height: makePxSize(p.baseWidth, screenSizesCoefficients[1]),
            },
            [theme.breakpoints.down('sm')]: {
                flex: `0 0 ${makePxSize(p.baseWidth, screenSizesCoefficients[2])}`, 
                height: makePxSize(p.baseWidth, screenSizesCoefficients[2]),
            }
        })}>
        <ResponsiveImage baseSize={baseSize} publicId={p.resourceImagePublicId} onClick={p.onResourceClicked}/>
        <ResponsivePhotoBox baseSize={baseSize} sx={theme => {
            const delta = baseSize / 2
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
            <AccountAvatar avatarImagePublicId={p.accountImagePublicId} avatarImageUrl={p.avatarImageUrl} name={p.accountName} onClick={p.onAccountClicked} />
        </ResponsivePhotoBox>
    </Box>
}

export default ResourceImage