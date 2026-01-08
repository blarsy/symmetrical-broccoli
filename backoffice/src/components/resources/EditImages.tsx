import { Box, Dialog, IconButton, Stack, SxProps, Typography } from "@mui/material"
import Edit from "@mui/icons-material/Edit"
import { useContext, useState } from "react"
import { urlFromPublicId } from "@/lib/images"
import ImageUpload from "../user/ImageUpload"
import PicturePlaceholder from '@/app/img/PHOTOS.svg?react'
import Delete from '@mui/icons-material/Delete'
import { ImageInfo } from "@/lib/schema"
import { UiContext } from "../scaffold/UiContextProvider"
import { lightPrimaryColor, primaryColor } from "@/utils"
import { Theme } from "@emotion/react"

interface Props {
    initialValue: string[]
    onChange: (newImagePublicId: string, previousPublicId?: string) => void
    onDeleteRequested: (image: ImageInfo) => void
    sx?: SxProps<Theme>
}

const EditImages = (p: Props) => {
    const uiContext = useContext(UiContext)
    const [pickingImage, setPickingImage] = useState<string | boolean>('')
    return <Stack direction="row" gap="1rem" overflow="auto" sx={p.sx}>
        <Stack sx={theme => ({ cursor: 'pointer', 
            alignItems: 'center',
            borderRadius: '2rem', 
            padding: '2rem', 
            backgroundColor: uiContext.lightMode ? lightPrimaryColor : '#333', 
            height: 400,
            width: 400,
            [theme.breakpoints.down('lg')]: {
                width: 300,
                height: 300
            },
            [theme.breakpoints.down('md')]: {
                width: 200,
                height: 200
            },
            [theme.breakpoints.down('sm')]: {
                width: 100,
                height: 100
            }
        })} 
            justifyContent="center" height="400" onClick={() => {
                setPickingImage(true)
            }}>
            <PicturePlaceholder height="100" fill={uiContext.lightMode ? primaryColor : '#000'} />
            <Typography variant="body1" color={uiContext.lightMode ? primaryColor : lightPrimaryColor}>{uiContext.i18n.translator('addImageButtonLabel')}</Typography>
        </Stack>
        { p.initialValue.map((publicId, idx) => <Stack key={idx} alignItems="center" sx={theme => ({
            flex: '0 0 400px',
            [theme.breakpoints.down('lg')]: {
                flex: '0 0 300px',
            },
            [theme.breakpoints.down('md')]: {
                flex: '0 0 200px',
            },
            [theme.breakpoints.down('sm')]: {
                flex: '0 0 100px',
            }
        })}>
            <img alt="image" src={urlFromPublicId(publicId)} 
                style={{ width: '100%', height: '100%' }} />
            <Stack direction="row" justifyContent="space-around">
                <IconButton onClick={() => setPickingImage(publicId)}><Edit/></IconButton>
                <IconButton onClick={() => p.onDeleteRequested({ publicId })}><Delete /></IconButton>
            </Stack>
        </Stack>)}
        <Dialog open={!!pickingImage} onClose={() => setPickingImage('')}
            sx={{ margin: '1rem', flexDirection: 'column', alignItems: 'center' }}>
            <ImageUpload onUploaded={publicId => {
                p.onChange(publicId, pickingImage === true ? '' : pickingImage as string )
                setPickingImage('')
            }} />
        </Dialog>
    </Stack>
}

export default EditImages