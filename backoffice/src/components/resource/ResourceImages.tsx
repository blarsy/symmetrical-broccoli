import { Box, Chip, CircularProgress } from "@mui/material"
import FileUpload from "../FileUpload"
import { beginOperation, fromData, fromError, initial } from "@/app/DataLoadState"
import { Image as ImageData } from "@/schema"
import { useState } from "react"
import Feedback from "../Feedback"
import EnlargableImage from "../EnlargableImage"

const imagePublicBaseUrl = process.env.NEXT_PUBLIC_NOCO_API_URL

interface Props {
    images: File[],
    setImages: (files: File[]) => void,
    onImagesSelected?: (files: File[]) => void,
    existingImages: ImageData[],
    onRequestImageDelete: (image: ImageData) => Promise<void>,
    justifySelf: string
}
const imageSize = 150

const ResourceImages = ({ images, setImages, onImagesSelected, onRequestImageDelete, existingImages, justifySelf="center" }: Props) => {
    const [feedback, setFeedback] = useState(initial<null>(false))
    return <Box justifySelf={justifySelf}>
        <FileUpload onImagesSelected={async files => {
            setFeedback(beginOperation())
            const filesToAdd: File[] = []
            for(let i = 0; i < files.length; i++) {
                filesToAdd.push(files[i])
            }
            
            try {
                if(!onImagesSelected) {
                    setImages([ ...images, ...filesToAdd])
                } else {
                    onImagesSelected && onImagesSelected(filesToAdd)
                }
                setFeedback(fromData(null))
            } catch (e: any) {
                setImages([ ...images, ...filesToAdd])
                setFeedback(fromError(e, 'Error processing selected image(s)'))
            }
        }} />
        { images && 
            <Box margin="1rem">
                { images.map(image => <Chip key={image.name} label={`${image.name}`} onDelete={() => 
                    setImages([...(images.filter(file => file !== image))]) } />
                )}
            </Box>
        }
        { existingImages &&
            <Box display="flex" flexDirection="row" gap="0.5rem" margin="1rem">
                {feedback.loading && <CircularProgress/>}
                {feedback.error && <Feedback severity="error" message={feedback.error.message!} detail={feedback.error.detail} />}
                { existingImages.map(image => <EnlargableImage key={image.title}
                    title={image.title} path={`${imagePublicBaseUrl}/${image.path}`} size={imageSize}
                    onDeleteRequested={() => onRequestImageDelete(image)} />)}
            </Box>
        }
    </Box>
}

export default ResourceImages