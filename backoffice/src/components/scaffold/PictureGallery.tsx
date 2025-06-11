import { IconButton, Stack, SxProps, Theme, Typography, useTheme } from "@mui/material"
import { useContext, useState } from "react"
import Arrow from '@/app/img/fleche.svg'
import EmptyImage from '@/app/img/PHOTOS.svg'
import { AppContext } from "./AppContextProvider"
import { ResponsivePhotoBox } from "../misc"

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
    const appContext = useContext(AppContext)
    const [currentImage, setCurrentImage] = useState(0)

    if(p.images.length === 0){
        return <Stack direction="row" sx={{
            alignItems: 'center',
             ...p.sx }}>
            <ResponsivePhotoBox>
                <EmptyImage fill={theme.palette.primary.main} width="100%"/>
                <Typography variant="body1" textAlign="center">{appContext.i18n.translator('noPicture')}</Typography>
            </ResponsivePhotoBox>
        </Stack>
    }

    return <Stack direction="row" sx={{
        alignItems: 'center',
         ...p.sx }}>
        <IconButton sx={{ visibility: currentImage === 0 ? 'hidden' : 'visible', height: 30, transform: 'scaleX(-1)' }} 
            onClick={e => {
                setCurrentImage(prev => prev - 1)
            }}>
            <Arrow fill={ theme.palette.primary.contrastText } height="100%"/>
        </IconButton>
        <ResponsivePhotoBox>
            <img style={{ cursor: 'pointer', borderRadius: '25px' }} alt={p.images[currentImage].alt} 
                src={p.images[currentImage].uri} height="100%" 
                onClick={e => {
                    p.onImageClicked && p.onImageClicked(p.images[currentImage])
                }}/>
        </ResponsivePhotoBox>
        <IconButton sx={{ visibility: currentImage === (p.images.length - 1) ? 'hidden' : 'visible', height: 30 }} 
            onClick={e => {
                setCurrentImage(prev => prev + 1)
            } }>
            <Arrow fill={ theme.palette.primary.contrastText } height="100%"/>
        </IconButton>
    </Stack>
}

export default PictureGallery