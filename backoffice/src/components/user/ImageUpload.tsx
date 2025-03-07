import { Stack, Button, Typography, Alert } from '@mui/material'
import { useContext, useEffect, useRef, useState } from 'react'
import { AppContext } from '../scaffold/AppContextProvider'
import ReactCrop, { type Crop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { getCommonConfig } from '@/config'
import { LoadingButton } from '@mui/lab'
import { useDebounce } from 'use-debounce'
import { fromData, fromError, initial } from '@/lib/DataLoadState'
import { STANDARD_RESOURCE_IMAGE_SQUARE_SIZE } from '@/lib/constants'
import { uploadImage } from '@/lib/images'

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

const ImageUpload = (p: Props) => {
    const appContext = useContext(AppContext)
    const [imageFile, setImageFile] = useState<File | undefined>()
    const [uploadState, setUploadState] = useState(initial(false, undefined))
    const [crop, setCrop] = useState<Crop>()
    const [completeCrop, setCompleteCrop] = useState<Crop>()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    //const [debouncedCompleteCrop] = useDebounce(completeCrop, 700)

    // useEffect(() => {
    //     if(!canvasRef.current || !imgRef.current || !completeCrop?.height || !completeCrop?.width) return
        
    //     previewCroppedImage(canvasRef.current, imgRef.current, completeCrop)
    // }, [debouncedCompleteCrop])

    return <Stack alignItems="center" color="primary" sx={{ padding: '2rem',
        minWidth: '20rem', minHeight: '20rem', maxHeight: '100vh', gap: '1rem', borderRadius: '1rem', 
        maxWidth: 'sm', overflow: 'auto', margin: 'auto' }}>
        <input type="file" accept="POST" style={{ display: "none" }}
            ref={fileInputRef}
            onChange={e => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0]
                    setImageFile(file)
                }
            }}/>
        <Button variant="outlined" onClick={() => fileInputRef.current?.click()} color="primary">{appContext.i18n.translator('selectLocalFileButton')}</Button>
        <Typography color="primary" variant="caption">{appContext.i18n.translator('dragImageHere')}</Typography>
        { imageFile && [<ReactCrop key="crop"
                crop={crop} onComplete={(c) => setCompleteCrop(c)} 
                onChange={(c) => setCrop(c)}
                aspect={1} style={{ overflow: 'auto' }}>
                <img ref={imgRef} src={URL.createObjectURL(imageFile)} style={{ width: '100%' }} alt="preview" />
            </ReactCrop>,
            <LoadingButton loading={uploadState.loading} key="button" variant="contained" onClick={async () => {
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
            }}>{appContext.i18n.translator('uploadButtonCaption')}</LoadingButton>] }
        { uploadState.error && <Alert severity="error" onClose={() => setUploadState(initial(false, undefined))}>
            { uploadState.error.message }
        </Alert> }
        {/* { completeCrop && <canvas ref={canvasRef} style={{ 
            objectFit: 'contain',
            width: completeCrop.width,
            height: completeCrop.height,
         }} ></canvas> } */}
    </Stack>
}

export default ImageUpload