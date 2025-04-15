import { Dialog, IconButton, Stack } from "@mui/material"
import Edit from "@mui/icons-material/Edit"
import { useState } from "react"
import { urlFromPublicId } from "@/lib/images"
import ImageUpload from "../user/ImageUpload"
import AddToPhotosIcon from '@mui/icons-material/AddToPhotos'
import Delete from '@mui/icons-material/Delete'
import { ImageInfo } from "@/lib/schema"

interface Props {
    initialValue: string
    onChange: (newImagePublicId: string, previousPublicId?: string) => void
    onDeleteRequested: (image: ImageInfo) => void
}

const EditImage = (p: Props) => {
    const [pickingImage, setPickingImage] = useState(false)
    return <Stack alignItems="center">
        { p.initialValue && <img alt="image" src={urlFromPublicId(p.initialValue)} 
            style={{ width: '100%', height: '100%' }} /> }
        { p.initialValue ? 
            <Stack direction="row" justifyContent="space-around">
                <IconButton onClick={() => setPickingImage(true)}><Edit/></IconButton>
                <IconButton onClick={() => p.onDeleteRequested({ publicId: p.initialValue })}><Delete /></IconButton>
            </Stack>
        :
            <IconButton onClick={() => setPickingImage(true)}><AddToPhotosIcon/></IconButton>
        }
        <Dialog open={pickingImage} onClose={() => setPickingImage(false)} sx={{ margin: '1rem', flexDirection: 'column', alignItems: 'center' }}>
            <ImageUpload onUploaded={publicId => {
                p.onChange(publicId, p.initialValue)
                setPickingImage(false)
            }} />
        </Dialog>
    </Stack>

}

export default EditImage