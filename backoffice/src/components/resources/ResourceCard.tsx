import { Card, CardContent, CardHeader, CardMedia, Dialog, Stack, useTheme } from "@mui/material"
import { useRouter } from "next/navigation"
import ExpirationIndicator from "./ExpirationIndicator"
import PictureGallery from "../scaffold/PictureGallery"
import { urlFromPublicId } from "@/lib/images"
import { AccountAvatar } from "../misc"
import EmptyImage from '@/app/img/PHOTOS.svg'
import { useState } from "react"

const limitTextLength = (text: string, maxLength: number) => {
    if(text.length < maxLength)
        return text
    let i = maxLength - 3
    while(text[i].match(/[^ .,'"()!-_;:]/))
        i --

    return `${text.substring(0, i)}...`
}

interface Props {
    version: string
    resource: {
        id: number
        avatarPublicId?: string
        accountName?: string
        expiration?: Date
        title: string
        description: string
        images: string[]
        accountId?: number
    }
}

const ResourceCard = (p: Props) => {
    const theme = useTheme()
    const router = useRouter()
    const [zoomedImg, setZoomedImg] = useState<string | undefined>(undefined)

    let avatar: JSX.Element
    if(p.resource.accountName) {
        avatar = <AccountAvatar sx={theme => ({ 
            width: '5rem', 
            height: '5rem',
            [theme.breakpoints.down('sm')]: {
              width: '3.5rem', 
              height: '3.5rem',
            }
          })} name={p.resource.accountName || ''} onClick={() => {
            router.push(`/webapp/${p.version}/account/${p.resource.accountId}`)
          }}
          avatarImagePublicId={p.resource.avatarPublicId} />
    } else if(p.resource.images.length === 0) {
        avatar = <EmptyImage fill={theme.palette.primary.main} width="5rem" height="5rem"/>
    } else {
        avatar = <img style={{ borderRadius: '25px', width: '5rem', height: '5rem' }} alt="image" src={urlFromPublicId(p.resource.images[0])} />
    }
    return <Card key={p.resource.id} sx={theme => ({
        display: 'flex',
        flexDirection: 'column',
        flex: '0 1 23%',
        [theme.breakpoints.down('lg')]: {
            flex: '0 1 30%'
        },
        [theme.breakpoints.down('md')]: {
            flex: '0 1 45%'
        },
        [theme.breakpoints.down('sm')]: {
            flex: '0 1 100%'
        }
    })}>
      <CardHeader avatar={avatar} titleTypographyProps={{ 
        sx: { cursor: 'pointer'},
        onClick: () => {
            router.push(`/webapp/${p.version}/view/${p.resource.id}`)
        } }} title={p.resource.title} subheader={<ExpirationIndicator value={p.resource.expiration} />} />
        <CardMedia>
            <PictureGallery sx={{ justifyContent: "center" }} images={p.resource.images.map((publicId, idx: number) => 
                ({ uri: urlFromPublicId(publicId), alt: idx.toString() }))} onImageClicked={img => setZoomedImg(img.uri)}/>
        </CardMedia>
      <CardContent>{limitTextLength(p.resource.description, 70)}</CardContent>
        <Dialog open={!!zoomedImg} onClose={() => setZoomedImg(undefined)} fullScreen>
            <Stack sx={{ height: '100vh', backgroundColor: 'transparent', alignItems: 'center' }}>
                <img src={zoomedImg} style={{ height: 'inherit', width: 'auto' }} onClick={() => setZoomedImg(undefined)} />
            </Stack>
        </Dialog>
    </Card>
}

export default ResourceCard

