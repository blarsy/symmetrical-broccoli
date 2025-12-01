import { IconButton, Stack, SxProps, Theme, Typography, useTheme } from "@mui/material"
import { useContext, useState } from "react"
import Arrow from '@/app/img/fleche.svg'
import EmptyImage from '@/app/img/PHOTOS.svg'
import { ResponsivePhotoBox } from "../misc"
import { UiContext } from "./UiContextProvider"

interface Props {
    images: {
        uri: string
        alt: string
    }[]
    sx?: SxProps<Theme>
    onImageClicked?: (img: {
        uri: string
        alt: string
    }) => void
}

const PictureGallery = (p: Props) => {
    const theme = useTheme()
    const uiContext = useContext(UiContext)
    const [currentImage, setCurrentImage] = useState(0)
    const [hovered, setHovered] = useState(false)

    if(p.images.length === 0){
        return <Stack direction="row" sx={{
            alignItems: 'center',
             ...p.sx }}>
            <ResponsivePhotoBox>
                <EmptyImage fill={theme.palette.primary.main} width="100%"/>
                <Typography variant="body1" textAlign="center">{uiContext.i18n.translator('noPicture')}</Typography>
            </ResponsivePhotoBox>
        </Stack>
    }

    return <Stack direction="row" sx={{
        alignItems: 'center',
        gap: '0.25rem',
         ...p.sx }}>
        <IconButton sx={theme => ({ 
                visibility: currentImage === 0 ? 'hidden' : 'visible', 
                height: 30, 
                width: 30,
                transform: 'scaleX(-1)',
                '&:hover': {
                    border: `1px solid ${theme.palette.primary.main}`
                }
            })} 
            onClick={e => {
                e.stopPropagation()
                setCurrentImage(prev => prev - 1)
            }}>
            <Arrow fill={ theme.palette.primary.contrastText } height="100%"/>
        </IconButton>
        <ResponsivePhotoBox>
            <img style={{ 
                cursor: 'pointer', 
                borderRadius: '25px',
                border: hovered ? `2px solid ${theme.palette.primary.main}`: ''
            }} alt={p.images[currentImage].alt}
                src={p.images[currentImage].uri} height="100%" 
                onMouseEnter={() => {
                    if(p.onImageClicked) setHovered(true)}
                }
                onMouseLeave={() => setHovered(false)}
                onClick={e => {
                    e.stopPropagation()
                    e.bubbles = false
                    p.onImageClicked && p.onImageClicked(p.images[currentImage])
                }}/>
        </ResponsivePhotoBox>
        <IconButton sx={theme => ({ 
                visibility: currentImage === (p.images.length - 1) ? 'hidden' : 'visible', 
                height: 30, 
                width: 30,
                '&:hover': {
                    border: `1px solid ${theme.palette.primary.main}`
                }
            })} 
            onClick={e => {
                e.stopPropagation()
                setCurrentImage(prev => prev + 1)
            } }>
            <Arrow fill={ theme.palette.primary.contrastText } height="100%"/>
        </IconButton>
    </Stack>
}

export default PictureGallery