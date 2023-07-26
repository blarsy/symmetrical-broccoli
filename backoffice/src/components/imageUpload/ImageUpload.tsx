import { Box, Fab } from "@mui/material"
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate"
import DataLoadState from "@/DataLoadState"

interface Props {
    onImageSelected: (file: File) => Promise<void>
}

const ImageUpload = ({ onImageSelected }: Props) => {
    return <Box>
        <input
            accept="image/*"
            id="file-img"
            hidden
            type="file"
            onChange={async e => {
                if(e.target.files && e.target.files.length > 0) {
                    onImageSelected(e.target.files.item(0) as File)
                }
            }}
        />
        <label htmlFor="file-img">
            <Fab component="span"><AddPhotoAlternateIcon /></Fab>
        </label>
    </Box>
}

export default ImageUpload