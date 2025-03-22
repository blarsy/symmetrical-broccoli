import { IconButton, Stack, SxProps, Theme, Typography, useTheme } from "@mui/material"
import { PropsWithChildren, useContext, useState } from "react"
import Arrow from '@/app/img/fleche.svg'
import { Box } from "@mui/system"
import EmptyImage from '@/app/img/PHOTOS.svg'
import { AppContext } from "./AppContextProvider"

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

const PhotoBox = (p: PropsWithChildren) => {
    const theme = useTheme()

    return <Box sx={{
        alignContent: 'center',
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
        {p.children}
    </Box>
}

const PictureGallery = (p: Props) => {
    const theme = useTheme()
    const appContext = useContext(AppContext)
    const [currentImage, setCurrentImage] = useState(0)

    if(p.images.length === 0){
        return <Stack direction="row" sx={{
            alignItems: 'center',
             ...p.sx }}>
            <PhotoBox>
                <EmptyImage fill={theme.palette.primary.main} width="100%"/>
                <Typography variant="body1" textAlign="center">{appContext.i18n.translator('noPicture')}</Typography>
            </PhotoBox>
        </Stack>
    }

    return <Stack direction="row" sx={{
        alignItems: 'center',
         ...p.sx }}>
        <IconButton sx={{ visibility: currentImage === 0 ? 'hidden' : 'visible', height: 30, transform: 'scaleX(-1)' }} onClick={() => setCurrentImage(prev => prev - 1)}>
            <Arrow fill={ theme.palette.primary.contrastText } height="100%"/>
        </IconButton>
        <PhotoBox>
            <img style={{ cursor: 'pointer', borderRadius: '25px' }} alt={p.images[currentImage].alt} src={p.images[currentImage].uri} height="100%" onClick={() => p.onImageClicked(p.images[currentImage])}/>
        </PhotoBox>
        <IconButton sx={{ visibility: currentImage === (p.images.length - 1) ? 'hidden' : 'visible', height: 30 }} 
            onClick={() => setCurrentImage(prev => prev + 1)}>
            <Arrow fill={ theme.palette.primary.contrastText } height="100%"/>
        </IconButton>
    </Stack>
}

export default PictureGallery