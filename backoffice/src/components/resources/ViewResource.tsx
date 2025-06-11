import { gql, useQuery } from "@apollo/client"
import LoadedZone from "../scaffold/LoadedZone"
import { ReactElement, useContext, useEffect, useState } from "react"
import { fromServerGraphResource, Resource } from "@/lib/schema"
import useCategories from "@/lib/useCategories"
import { Box, Chip, Dialog, Stack, Tooltip, Typography } from "@mui/material"
import Hourglass from "@mui/icons-material/HourglassTop"
import dayjs from "dayjs"
import { AppContext } from "../scaffold/AppContextProvider"
import Link from "next/link"
import { AccountAvatar, ResponsivePhotoBox } from "../misc"
import { urlFromPublicId } from "@/lib/images"
import DisplayLocation from "../user/DisplayLocation"

const GET_RESOURCE = gql`query GetResource($id: Int!) {
    resourceById(id: $id) {
      accountByAccountId {
        email
        id
        name
        willingToContribute
        imageByAvatarImageId {
          publicId
        }
      }
      canBeDelivered
      canBeExchanged
      canBeGifted
      canBeTakenAway
      description
      id
      isProduct
      isService
      expiration
      title
      resourcesResourceCategoriesByResourceId {
        nodes {
          resourceCategoryCode
        }
      }
      resourcesImagesByResourceId {
        nodes {
          imageByImageId {
            publicId
          }
        }
      }
      locationBySpecificLocationId {
        address
        latitude
        longitude
        id
      }
      suspended
      paidUntil
      created
      deleted
      subjectiveValue
    }
}`

interface Props {
    resourceId: number
}

const ViewResource = (p: Props) => {
    const categories = useCategories()
    const {loading, error, data} = useQuery(GET_RESOURCE, { variables: { id: p.resourceId }})
    const [resource, setResource] = useState<Resource>()
    const [zoomedImg, setZoomedImg] = useState<string>()
    const appContext = useContext(AppContext)

    useEffect(() => {
        if(data && categories.data) {
            setResource(fromServerGraphResource(data.resourceById, categories.data))
        }
    }, [data, categories.data])

    return <LoadedZone loading={loading} error={error} containerStyle={{ overflow: 'auto', gap: '0.5rem', 
        paddingBottom: '1rem', paddingRight: '2rem', paddingLeft: '2rem' }}>
        { resource && (() => {
            const fields: ReactElement[]= []
            if(resource.images && resource.images.length > 0) {
              fields.push(<Stack key="pics" direction="row" gap="0.5rem" justifyContent="center">
                { resource.images.map((img, idx) => <ResponsivePhotoBox key={idx}>
                    <img style={{ cursor: 'pointer', borderRadius: '25px' }} height="100%" alt="" 
                      src={urlFromPublicId(img.publicId!)} 
                      onClick={() => setZoomedImg(urlFromPublicId(img.publicId!))}/>
                </ResponsivePhotoBox>) }
              </Stack>)
            }
            fields.push(
                <Typography key="title" variant="h1" color="primary">{resource.title}</Typography>,
                <Link key="creator" href={`../account/${resource.account!.id}`}>
                    <Stack direction="row" gap="1rem" alignItems="center">
                        <AccountAvatar sx={{ width: '3rem', height: '3rem' }} name={resource.account!.name}
                          avatarImageUrl={resource.account?.avatarImageUrl} />
                        <Typography flex="1" color="primary" variant="overline">{resource.account?.name}</Typography>
                    </Stack>
                </Link>,
                <Stack key="cats" direction="row" gap="0.5rem">
                  <Typography color="primary" variant="body1">{appContext.i18n.translator('categoriesTitle')}</Typography>
                  {resource.categories.map(cat => <Chip key={cat.code} label={cat.name}/>)}
                </Stack>,
                <Typography key="desc" variant="body1" color="primary">{resource.description}</Typography>
            )
            if(resource.expiration) {
                fields.push(<Tooltip key="exp" placement="bottom-start" title={dayjs(resource.expiration).format(appContext.i18n.translator('fulldateFormat'))}>
                    <Stack direction="row">
                        <Typography color="primary" variant="body1">{appContext.i18n.translator('expirationFieldLabel')}</Typography>
                        <Hourglass color="primary"/>
                        <Typography color="primary" variant="body1">{dayjs(resource.expiration).fromNow()}</Typography>
                    </Stack>
                </Tooltip>)
            }
            fields.push(
              <Stack direction="row" gap="0.5rem" key="nature">
                <Typography color="primary" variant="body1">{appContext.i18n.translator('natureOptionsLabel')}</Typography>
                { resource.isProduct && <Chip label={appContext.i18n.translator('isProduct')}/> }
                { resource.isService && <Chip label={appContext.i18n.translator('isService')}/> }
              </Stack>,
              <Stack direction="row" gap="0.5rem" key="type">
                <Typography color="primary" variant="body1">{appContext.i18n.translator('exchangeTypeOptionsLabel')}</Typography>
                { resource.canBeGifted && <Chip label={appContext.i18n.translator('canBeGifted')}/> }
                { resource.canBeExchanged && <Chip label={appContext.i18n.translator('canBeExchanged')}/> }
              </Stack>)
            if(resource.canBeDelivered || resource.canBeTakenAway) {
              fields.push(<Stack direction="row" gap="0.5rem" key="deliv">
                <Typography color="primary" variant="body1">{appContext.i18n.translator('deliveryOptionsLabel')}</Typography>
                { resource.canBeDelivered && <Chip label={appContext.i18n.translator('canBeDelivered')}/> }
                { resource.canBeTakenAway && <Chip label={appContext.i18n.translator('canBeTakenAway')}/> }
              </Stack>)
            }
            if(resource.specificLocation) {
              fields.push(<DisplayLocation key="loc" value={resource.specificLocation}/>)
            }
            return fields
        })() }
        <Dialog open={!!zoomedImg} onClose={() => setZoomedImg(undefined)} fullScreen>
            <Stack sx={{ height: '100vh', backgroundColor: 'transparent', alignItems: 'center' }} onClick={() => setZoomedImg(undefined)}>
                <img src={zoomedImg} style={{ height: 'inherit', width: 'auto' }} />
            </Stack>
        </Dialog>
    </LoadedZone>
}

export default ViewResource