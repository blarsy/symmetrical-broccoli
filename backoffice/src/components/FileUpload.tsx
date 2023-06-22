import { Box, Fab } from "@mui/material"
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate"
import DataLoadState from "@/app/DataLoadState"

interface Props {
    onImagesSelected: (list: FileList) => Promise<void>
}

const FileUpload = ({ onImagesSelected }: Props) => {
    return <Box>
        <input
            accept="image/*"
            id="file-img"
            multiple
            hidden
            type="file"
            onChange={async e => {
                if(e.target.files && e.target.files.length > 0) {
                    onImagesSelected(e.target.files)
                }
            }}
        />
        <label htmlFor="file-img">
            <Fab component="span"><AddPhotoAlternateIcon /></Fab>
        </label>
    </Box>
}

export default FileUpload