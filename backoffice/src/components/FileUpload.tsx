import { Box, Fab } from "@mui/material"
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate"
import axios from "axios"
import { useState } from "react"
import { fromData, fromError, initial } from "@/app/DataLoadState"
import Feedback from "./Feedback"

const projectName = process.env.NEXT_PUBLIC_NOCO_PROJET_NAME as string
const url = process.env.NEXT_PUBLIC_NOCO_API_URL as string

interface Props {
    uiName: string
}

const FileUpload = ({ uiName }: Props) => {
    const [feedback, setFeedback] = useState(initial<string>())
    return <Box>
        <input
            accept="image/*"
            id="file-img"
            multiple
            hidden
            type="file"
            onChange={async e => {
                if(e.target.files && e.target.files.length > 0) {
                    try {
                        const res = await axios.postForm('/api/resource/image', { file: e.target.files[0] } , { headers: {
                            Authorization: localStorage.getItem('token') as string,
                            "Content-Type": "multipart/form-data"
                        }})
                        setFeedback(fromData(uiName))
                    } catch (e: any) {
                        setFeedback(fromError(e, 'Erreur au téléchargement de l\'image'))
                    }
                }
            }}
        />
        <label htmlFor="file-img">
            <Fab component="span"><AddPhotoAlternateIcon /></Fab>
        </label>
        {feedback.data && <Feedback message={feedback.data as string} severity="success" />}
        {feedback.error && <Feedback message={feedback.error.message!} detail={feedback.error.detail} severity="error"/>}
    </Box>
}

export default FileUpload