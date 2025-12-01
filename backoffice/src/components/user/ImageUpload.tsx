import { Stack, Button, Typography } from '@mui/material'
import { useContext, useRef, useState } from 'react'
import ReactCrop, { type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { LoadingButton } from '@mui/lab'
import { fromData, fromError, initial } from '@/lib/DataLoadState'
import { STANDARD_RESOURCE_IMAGE_SQUARE_SIZE } from '@/lib/constants'
import { uploadImage } from '@/lib/images'
import Feedback from '../scaffold/Feedback'
import { UiContext } from '../scaffold/UiContextProvider'
import { primaryColor } from '@/utils'
import { AppDispatchContext } from '../scaffold/AppContextProvider'

const previewCroppedImage = async (canvas: HTMLCanvasElement, image: HTMLImageElement, crop: Crop) => {
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('No 2d context')
    }
  
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const pixelRatio = window.devicePixelRatio
  
    canvas.width = Math.floor(crop.width * scaleX * pixelRatio)
    canvas.height = Math.floor(crop.height * scaleY * pixelRatio)
  
    ctx.scale(pixelRatio, pixelRatio)
    ctx.imageSmoothingQuality = 'high'
  
    const cropX = crop.x * scaleX
    const cropY = crop.y * scaleY
  
    ctx.save()
  
    ctx.translate(-cropX, -cropY)

    await (async (image: HTMLImageElement) => {
        while(!image.complete) {
            await new Promise(res => setTimeout(res, 100))
        }

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
    })(image)
  
    ctx.restore()
}

const uploadCroppedImage = async (image: HTMLImageElement, crop: Crop) => {
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    const pixelRatio = window.devicePixelRatio

    const canvas = new OffscreenCanvas(STANDARD_RESOURCE_IMAGE_SQUARE_SIZE, STANDARD_RESOURCE_IMAGE_SQUARE_SIZE)
    // canvas.width = STANDARD_RESOURCE_IMAGE_SQUARE_SIZE
    // canvas.height = STANDARD_RESOURCE_IMAGE_SQUARE_SIZE

    const ctx = canvas.getContext('2d')

    if (!ctx) {
        throw new Error('No 2d context')
    }
    
    ctx.scale(pixelRatio, pixelRatio)
    ctx.imageSmoothingQuality = 'high'

    const cropX = crop.x * scaleX
    const cropY = crop.y * scaleY

    ctx.save()

    await (async (image: HTMLImageElement) => {
        while(!image.complete) {
            await new Promise(res => setTimeout(res, 100))
        }

        ctx.drawImage(
            image,
            cropX, cropY,
            crop.width * scaleX * pixelRatio,
            crop.height * scaleY * pixelRatio,
            0,
            0,
            STANDARD_RESOURCE_IMAGE_SQUARE_SIZE,
            STANDARD_RESOURCE_IMAGE_SQUARE_SIZE
        )
    })(image)

    ctx.restore()

    const blob = await canvas.convertToBlob({
        type: 'image/png'
    })
    const base64 = await new Promise(res => {
        const reader = new FileReader()
        reader.readAsDataURL(blob)
        reader.onload = () => {
            res(reader.result as string)
        }
    }) as string
    return await uploadImage(base64)
}

interface Props {
    onUploaded: (publicId: string) => void
}
const isImageMimeType = (type: string): boolean => {
    const matches = type.match(/^image:(gif|jpg|jpeg|webp|bmp)$/)
    if(!matches) return false
    return matches.length > 0
}

const ImageUpload = (p: Props) => {
    const uiContext = useContext(UiContext)
    const [imageFile, setImageFile] = useState<File | undefined>()
    const [uploadState, setUploadState] = useState(initial(false, undefined))
    const [crop, setCrop] = useState<Crop>()
    const [completeCrop, setCompleteCrop] = useState<Crop>()
    const fileInputRef = useRef<HTMLInputElement>(null)
    //const canvasRef = useRef<HTMLCanvasElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const [isDraggedOver, setIsDraggedOver] = useState(false)
    const [fileFormatError, setFileFormatError] = useState(false)
    //const [debouncedCompleteCrop] = useDebounce(completeCrop, 700)

    // useEffect(() => {
    //     if(!canvasRef.current || !imgRef.current || !completeCrop?.height || !completeCrop?.width) return
        
    //     previewCroppedImage(canvasRef.current, imgRef.current, completeCrop)
    // }, [debouncedCompleteCrop])

    return <Stack component="div" alignItems="center" color="primary" sx={{ padding: '2rem',
        minWidth: '20rem', minHeight: '20rem', maxHeight: '100vh', gap: '1rem', 
        maxWidth: 'sm', overflow: 'auto', margin: 'auto', opacity: isDraggedOver ? 0.5 : 1, 
        border: isDraggedOver ? `2px solid ${primaryColor}` : 'none' }} 
        onDragEnter={e => {
            setIsDraggedOver(true)
        }} 
        onDragLeave={() => {
            setIsDraggedOver(false)
        }}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { 
            e.preventDefault()
            console.log(e.dataTransfer.files[0].type)
            if(e.dataTransfer.files[0].type.match(/^image\/(gif|jpg|jpeg|webp)$/)) {
                setImageFile(e.dataTransfer.files[0])
            } else {
                setFileFormatError(true)
            }
            setIsDraggedOver(false)
        }}>
        <input type="file" accept="POST" style={{ display: "none" }}
            ref={fileInputRef}
            onChange={e => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0]
                    setImageFile(file)
                }
            }}/>
        <Button variant="outlined" onClick={() => fileInputRef.current?.click()} color="primary">{uiContext.i18n.translator('selectLocalFileButton')}</Button>
        <Typography color="primary" variant="caption">{uiContext.i18n.translator('dragImageHere')}</Typography>
        { imageFile && <Stack gap="0.5rem">
            <ReactCrop key="crop"
                crop={crop} onComplete={(c) => setCompleteCrop(c)} 
                onChange={(c) => setCrop(c)}
                aspect={1}>
                <img ref={imgRef} src={URL.createObjectURL(imageFile)} style={{ width: '100%' }} alt="preview" />
            </ReactCrop>
            <Stack>
                { !crop && <Typography textAlign="center" variant="body1">{uiContext.i18n.translator('drawASquareWithinTheImage')}</Typography> }
                <LoadingButton disabled={!crop} loading={uploadState.loading} key="button" variant="contained" onClick={async () => {
                    if(imgRef.current && completeCrop) {
                        try {
                            setUploadState(initial(true, undefined))
                            // await previewCroppedImage(canvasRef.current!, imgRef.current, completeCrop)
                            const publicId = await uploadCroppedImage(imgRef.current, completeCrop)
                            p.onUploaded(publicId)
                            setUploadState(fromData(undefined))
                        } catch(e) {
                            setUploadState(fromError(e as Error, (e as Error).message))
                        }
                    }
                }}>{uiContext.i18n.translator('uploadButtonCaption')}</LoadingButton>
            </Stack>
        </Stack> }
        <Feedback severity="error" message={uiContext.i18n.translator('fileNotRecognizedAsImage')} visible={fileFormatError}
            onClose={() => setFileFormatError(false)}/>
        <Feedback severity="error" message={uploadState.error?.message} visible={!!uploadState.error}
            onClose={() => setUploadState(initial(false, undefined))} />
    </Stack>
}

export default ImageUpload