import { IconButton, Stack, SxProps, Theme, useTheme } from "@mui/material"
import { useState } from "react"
import Arrow from '@/app/img/fleche.svg'
import { Box } from "@mui/system"

interface Props {
    images: {
        uri: string
        alt: string
    }[]
    sx?: SxProps<Theme>
    onImageClicked: (img: {
        uri: string
        alt: string
    }) => void
}

const PictureGallery = (p: Props) => {
    const theme = useTheme()
    const [currentImage, setCurrentImage] = useState(0)

    return <Stack direction="row" sx={{
        alignItems: 'center',
         ...p.sx }}>
        <IconButton sx={{ visibility: currentImage === 0 ? 'hidden' : 'visible', height: 30, transform: 'scaleX(-1)' }} onClick={() => setCurrentImage(prev => prev - 1)}>
            <Arrow fill={ theme.palette.primary.contrastText } height="100%"/>
        </IconButton>
        <Box sx={{
            height: '210px',
            width: '210px',
            [theme.breakpoints.down('lg')]: {
                height: '200px',
                width: '200px'
            },
            [theme.breakpoints.down('md')]: {
                height: '150px',
                width: '150px'
            },
            [theme.breakpoints.down('sm')]: {
                height: '100px',
                width: '100px'
            }}}>
            <img style={{ cursor: 'pointer', borderRadius: '25px' }} alt={p.images[currentImage].alt} src={p.images[currentImage].uri} height="100%" onClick={() => p.onImageClicked(p.images[currentImage])}/>
        </Box>
        <IconButton sx={{ visibility: currentImage === (p.images.length - 1) ? 'hidden' : 'visible', height: 30 }} 
            onClick={() => setCurrentImage(prev => prev + 1)}>
            <Arrow fill={ theme.palette.primary.contrastText } height="100%"/>
        </IconButton>
    </Stack>
}

export default PictureGallery