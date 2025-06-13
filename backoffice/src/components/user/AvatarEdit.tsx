import { Avatar, Dialog, IconButton, Modal, Stack } from "@mui/material"
import Edit from "@mui/icons-material/Edit"
import { useState } from "react"
import ImageUpload from "./ImageUpload"
import { urlFromPublicId } from "@/lib/images"

interface Props {
    initialValue: string
    onChange: (newImagePublicId: string) => void
}

const AvatarEdit = (p: Props) => {
    const [pickingImage, setPickingImage] = useState(false)
    return <Stack sx={{ position: 'relative', padding: '2rem', maxWidth: '20rem', alignSelf: 'center' }}>
        <Avatar src={urlFromPublicId(p.initialValue)} 
            sx={theme => ({
                width: '20rem', height: '20rem' ,
                [theme.breakpoints.down('md')]: {
                    width: '15rem', height: '15rem'
                },
                [theme.breakpoints.down('sm')]: {
                    width: '10rem', height: '10rem'
                },
            })} />
        <IconButton sx={{ position: 'absolute', bottom: '40px', right: 0 }} onClick={() => setPickingImage(true)}><Edit/></IconButton>
        <Dialog open={pickingImage} onClose={() => setPickingImage(false)} sx={{ margin: '1rem', flexDirection: 'column', alignItems: 'center' }}>
            <ImageUpload onUploaded={publicId => {
                p.onChange(publicId)
                setPickingImage(false)
            }} />
        </Dialog>
    </Stack>

}

export default AvatarEdit