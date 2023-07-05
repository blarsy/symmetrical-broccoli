import { Box, Chip, CircularProgress } from "@mui/material"
import { beginOperation, fromData, fromError, initial } from "@/app/DataLoadState"
import { Image as ImageData } from "@/schema"
import { useState } from "react"
import Feedback from "../Feedback"
import EnlargableImage from "../imageUpload/EnlargableImage"
import CroppedImageUpload from "../imageUpload/CroppedImageUpload"
import { ResourceImage } from "./ResourceImage"

const imagePublicBaseUrl = process.env.NEXT_PUBLIC_IMG_URL

interface Props {
    images: ResourceImage[],
    setImages: (files: ResourceImage[]) => void,
    onImageSelected?: (file: ResourceImage) => void,
    existingImages: ImageData[],
    onRequestImageDelete: (image: ImageData) => Promise<void>,
    justifySelf: string
}
const imageSize = 150

const ResourceImages = ({ images, setImages, onImageSelected, onRequestImageDelete, existingImages, justifySelf="center" }: Props) => {
    const [feedback, setFeedback] = useState(initial<null>(false))
    return <Box justifySelf={justifySelf}>
        <CroppedImageUpload onImageSelected={async (file: ResourceImage) => {
            setFeedback(beginOperation())
            
            try {
                if(!onImageSelected) {
                    setImages([ ...images, file])
                } else {
                    onImageSelected && onImageSelected(file)
                }
                setFeedback(fromData(null))
            } catch (e: any) {
                setImages([ ...images, file])
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