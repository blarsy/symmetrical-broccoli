import { RefObject, useRef, useState } from "react"
import ImageUpload from "./ImageUpload"
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import { Box, Button, Container, Dialog, DialogActions, DialogContent } from "@mui/material"

import 'react-image-crop/dist/ReactCrop.css'
import { ResourceImage } from "../resource/ResourceImage"

const TO_RADIANS = Math.PI / 180

interface ImageUploadProps {
    onImageSelected: (file: ResourceImage) => void
}

function canvasPreview(
    image: HTMLImageElement,
    canvas: HTMLCanvasElement,
    crop: PixelCrop,
    scale = 1,
    rotate = 0,
    ) {
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        throw new Error('No 2d context')
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    // devicePixelRatio slightly increases sharpness on retina devices
    // at the expense of slightly slower render times and needing to
    // size the image back down if you want to download/upload and be
    // true to the images natural size.
    const pixelRatio = window.devicePixelRatio
    // const pixelRatio = 1

    canvas.width = Math.floor(crop.width * scaleX * pixelRatio)
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio)

    ctx.scale(pixelRatio, pixelRatio)
    ctx.imageSmoothingQuality = 'high'

    const cropX = crop.x * scaleX
    const cropY = crop.y * scaleY

    const rotateRads = rotate * TO_RADIANS
    const centerX = image.naturalWidth / 2
    const centerY = image.naturalHeight / 2

    ctx.save()

    // 5) Move the crop origin to the canvas origin (0,0)
    ctx.translate(-cropX, -cropY)
    // 4) Move the origin to the center of the original position
    ctx.translate(centerX, centerY)
    // 3) Rotate around the origin
    ctx.rotate(rotateRads)
    // 2) Scale the image
    ctx.scale(scale, scale)
    // 1) Move the center of the image to the origin (0,0)
    ctx.translate(-centerX, -centerY)
    ctx.drawImage(
        image,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
        0,
        0,
        image.naturalWidth,
        image.naturalHeight,
    )

    ctx.restore()
}

const CroppedImageUpload = ({ onImageSelected }: ImageUploadProps) => {
    const defaultCrop: Crop = { unit: '%', height: 70, width: 70, x: 15, y: 15 }
    const [imageCropping, setImageCropping] = useState({ file: null, crop: defaultCrop, completeCrop: null } as { file: string | null, fileName: string | undefined, crop: Crop, completeCrop: PixelCrop | null })
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)
    const hiddenAnchorRef = useRef<HTMLAnchorElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
  
    if(!imageCropping.file) {
        return <ImageUpload onImageSelected={async file => {
            const reader = new FileReader()
            reader.addEventListener('load', e => {
                setImageCropping({ file: e.target?.result as string, fileName: file.name, crop: imageCropping.crop, completeCrop: null })
            })

            reader.readAsDataURL(file)
        }} />
    } else {
        return <Dialog open={!!imageCropping.file}>
            <DialogContent>
                <CropImage fileBase64={imageCropping.file} imgRef={imgRef}
                    onCropComplete={crop => setImageCropping({ file: imageCropping.file, fileName: imageCropping.fileName,
                        crop: imageCropping.crop, completeCrop: crop })}/>
                <canvas
                    ref={previewCanvasRef}
                    style={{
                        display: 'none',
                        width: imageCropping.crop.width,
                        height: imageCropping.crop.height,
                    }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    setImageCropping({ file: null, fileName: undefined, crop: imageCropping.crop, completeCrop: imageCropping.completeCrop })
                }}>Annuler</Button>
                <Button onClick={() => {
                    if (
                        imageCropping.crop.width &&
                        imageCropping.crop.height &&
                        imgRef.current &&
                        previewCanvasRef.current
                    ) {
                        // We use canvasPreview as it's much faster than imgPreview.
                        canvasPreview(
                            imgRef.current,
                            previewCanvasRef.current,
                            imageCropping.completeCrop!,
                            1,
                            0,
                        )
                    }
                    if (!previewCanvasRef.current) {
                        throw new Error('Crop canvas does not exist')
                    }
                    
                    previewCanvasRef.current.toBlob((blob) => {
                        if (!blob) {
                            throw new Error('Failed to create blob')
                        }
                        onImageSelected({ blob, name: imageCropping.fileName! })
                        setImageCropping({ file: null, fileName: undefined, crop: defaultCrop, completeCrop: null })
                    })
                }}>Ok</Button>
                <a ref={hiddenAnchorRef}
                    download
                    style={{
                        position: 'absolute',
                        top: '-200vh',
                        visibility: 'hidden',
                    }}>
                    Hidden download
                </a>
            </DialogActions>
        </Dialog>
        
    }
}

interface CropProps {
    fileBase64: string,
    imgRef: RefObject<HTMLImageElement>
    onCropComplete: (crop: PixelCrop) => void
}

const makeInitialCrop = (imgRef: RefObject<HTMLImageElement>): Crop => {
    const img = imgRef.current
    if(img) {
        const smallestSize = Math.min(img.width, img.height)
        return {
            unit: "px",
            width: smallestSize,
            height: smallestSize,
            x: 0, y: 0
        }
    } else {
        return {
            unit: 'px',
            width: 100,
            height: 100,
            x: 25, y: 25
        }
    }
}

export const CropImage = ({ fileBase64, imgRef, onCropComplete }: CropProps) => {
    const [crop, setCrop] = useState(makeInitialCrop(imgRef))
    return <Box display="flex" flexDirection="column" justifyItems="center">
        <Container sx={{ display: 'flex', flexDirection: 'column', justifyItems: 'stretch' }} maxWidth={'sm'}>
            <ReactCrop crop={crop} aspect={1}
                onChange={(_, crop) => setCrop(crop) }
                onComplete={(crop, _) => onCropComplete(crop)}>
                <img src={fileBase64} ref={imgRef} width="100%" />
            </ReactCrop>
        </Container>
    </Box>
}

export default CroppedImageUpload