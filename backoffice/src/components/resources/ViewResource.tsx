import { useLazyQuery } from "@apollo/client"
import LoadedZone from "../scaffold/LoadedZone"
import { JSX, useContext, useEffect, useState } from "react"
import { fromServerGraphResource, Resource } from "@/lib/schema"
import useCategories from "@/lib/useCategories"
import { Chip, Dialog, IconButton, Stack, Tooltip, Typography } from "@mui/material"
import Hourglass from "@mui/icons-material/HourglassTop"
import dayjs from "dayjs"
import Link from "next/link"
import { AccountAvatar, PriceTag, ResponsiveImage, ZoomedImageDialog } from "../misc"
import { urlFromPublicId } from "@/lib/images"
import DisplayLocation from "../user/DisplayLocation"
import { UiContext } from "../scaffold/UiContextProvider"
import Chat from '@/app/img/CHAT.svg?react'
import { primaryColor } from "@/utils"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { GET_RESOURCE } from "@/lib/apolloClient"
import GiveIcon from '@/app/img/bid-received.svg?react'
import { AppContext } from "../scaffold/AppContextProvider"
import CreateBidDialog from "../bids/CreateBidDialog"
import Feedback from "../scaffold/Feedback"
import ConnectDialog from "../user/ConnectDialog"

interface Props {
    resourceId: number
}

const ViewResource = (p: Props) => {
    const categories = useCategories()
    const [getResource] = useLazyQuery(GET_RESOURCE)
    const [resource, setResource] = useState<DataLoadState<Resource>>(initial(true))
    const [zoomedImg, setZoomedImg] = useState<string>()
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [bidCreationSucceeded, setBidCreationSucceeded] = useState(false)
    const [resourceToBidOn, setResourceToBidOn] = useState<Resource>()
    const uiContext = useContext(UiContext)
    const appContext = useContext(AppContext)
    const [connecting, setConnecting] = useState(false)

    const loadResource = async() => {
        try {
          const res = await getResource({ variables: { id: p.resourceId }})
          setResource(fromData(fromServerGraphResource(res.data.resourceById, categories.data!)))
        } catch (e) {
          setResource(fromError(e, uiContext.i18n.translator('requestError')))
        }
    }

    useEffect(() => {
      if(categories.data) {
        loadResource()
      }
    }, [categories.data])

    return <LoadedZone testID="ViewResourceZone" loading={resource.loading} containerStyle={{ overflow: 'auto', paddingBottom: '2rem' }} error={resource.error}>
      <Stack sx={theme => ({ 
        flexDirection: 'row', 
        [theme.breakpoints.down('sm')]: {
            flexDirection: 'column',
        }
      })}>
        {(() => {
          const elements: JSX.Element[] = []
          if(resource.data?.images && resource.data?.images.length > 0) {
            elements.push(<Stack key="pic" minWidth="0" sx={theme => ({
              padding: '2rem',
              flex: '0 1 50%',
              gap: '1rem',
              [theme.breakpoints.down('sm')]: {
                  padding: '1rem',
                  flex: 1
              }
            })}>
            { resource.data.images.length > 0 &&
              <Stack flex="1" minHeight="0" alignItems="center">
                <img style={{ cursor: 'pointer', borderRadius: '25px', maxHeight:'100%', maxWidth: "100%"}} alt="" 
                  src={urlFromPublicId(resource.data.images[selectedImageIndex].publicId!)} 
                  onClick={() => setZoomedImg(urlFromPublicId(resource.data!.images[selectedImageIndex].publicId!))}/>
              </Stack>
            }
            { resource.data.images.length > 1 && <Stack direction="row" gap="1rem" overflow="auto" flex="0 0 auto">
              { resource.data.images.map((img, idx) => 
                <Stack key={idx} flex="1 0 0">
                  <ResponsiveImage baseSize={160} publicId={img.publicId} 
                    onClick={() => setSelectedImageIndex(idx)}
                    sx={{ 
                      opacity: idx === selectedImageIndex ? 0.4 : 1
                    }}
                  />
                </Stack>) }
              </Stack>}
            </Stack>)
          }
          if(resource.data) {
            elements.push(
              <Stack key="info" flex="0 1 50%" sx={theme => ({
                padding: '2rem',
                flex: '0 1 ' + (resource.data?.images && resource.data?.images.length > 0 ? '50%' : '100%'),
                overflow: 'auto',
                [theme.breakpoints.down('sm')]: {
                    padding: '1rem',
                    flex: '1',
                    overflow: 'visible'
                }})}>
                <Stack gap="0.5rem">
                  {(() => {
                    const fields = []
                    fields.push(
                        <Typography key="title" variant="h1" color="primary">{resource.data.title}</Typography>,
                        <Stack key="creator" direction="row" gap="1rem" justifyContent="space-between" alignItems="center">
                          <Link href={`../account/${resource.data.account!.id}`}>
                              <Stack direction="row" gap="1rem" alignItems="center">
                                  <AccountAvatar sx={{ width: '3rem', height: '3rem' }} name={resource.data.account!.name}
                                    avatarImagePublicId={resource.data.account?.avatarImagePublicId} />
                                  <Typography flex="1" color="primary" variant="overline">{resource.data.account?.name}</Typography>
                              </Stack>
                          </Link>
                          <Stack direction="row">
                            { !appContext.account ?
                              <IconButton color="primary" onClick={() => setConnecting(true)}>
                                <Chat fill={ primaryColor } width="2.5rem" height="2.5rem"/>
                              </IconButton>
                              : resource.data!.account!.id != appContext.account.id &&
                              <Link href={`/webapp/${uiContext.version}/chat/new/${resource.data!.id}`}>
                                <IconButton color="primary">
                                  <Chat fill={ primaryColor } width="2.5rem" height="2.5rem"/>
                                </IconButton>
                              </Link>
                            }
                            { appContext.account && resource.data!.account!.id != appContext.account.id && resource.data!.canBeExchanged && <IconButton data-testid="BidButton" color="primary" onClick={() => {
                              setResourceToBidOn(resource.data)
                            }}>
                              <GiveIcon height="2.5rem" width="2.5rem"/>
                            </IconButton> }
                          </Stack>
                        </Stack>,
                        <Typography key="catLabel" color="primary" variant="body1">{uiContext.i18n.translator('categoriesTitle')}</Typography>,
                        <Stack key="cats" direction="row">{resource.data?.categories.map(cat => <Chip key={`cat${cat.code}`} label={cat.name}/>)}</Stack>,
                        resource.data && resource.data.description && resource.data.description.split('\n').map((t, idx) => <Typography key={`desc${idx}`} variant="body1" color="primary">{t}</Typography>)
                    )
                    if(resource.data.expiration) {
                        fields.push(<Tooltip key="exp" placement="bottom-start" title={dayjs(resource.data.expiration).format(uiContext.i18n.translator('fulldateFormat'))}>
                            <Stack direction="row">
                                <Typography color="primary" variant="body1">{uiContext.i18n.translator('expirationFieldLabel')}</Typography>
                                <Hourglass color="primary"/>
                                <Typography color="primary" variant="body1">{dayjs(resource.data.expiration).fromNow()}</Typography>
                            </Stack>
                        </Tooltip>)
                    }
                    fields.push(
                      <Typography key="natureLabel" color="primary" variant="body1">{uiContext.i18n.translator('natureOptionsLabel')}</Typography>,
                      <Stack direction="row" gap="0.5rem" key="nature">
                        { resource.data.isProduct && <Chip label={uiContext.i18n.translator('isProduct')}/> }
                        { resource.data.isService && <Chip label={uiContext.i18n.translator('isService')}/> }
                      </Stack>,
                      <Typography key="exTypeLabel" color="primary" variant="body1">{uiContext.i18n.translator('exchangeTypeOptionsLabel')}</Typography>,
                      <Stack direction="row" gap="0.5rem" key="type">
                        { resource.data.canBeGifted && <Chip label={uiContext.i18n.translator('canBeGifted')}/> }
                        { resource.data.canBeExchanged && <Chip label={uiContext.i18n.translator('canBeExchanged')}/> }
                      </Stack>)
                    if(resource.data.price) {
                      fields.push(
                        <Typography key="price" color="primary" variant="body1">{uiContext.i18n.translator('PriceLabel')}</Typography>,
                        <PriceTag key="tag" value={resource.data?.price} />)
                    }
                    if(resource.data.canBeDelivered || resource.data.canBeTakenAway) {
                      fields.push( <Typography key="delivLabel" color="primary" variant="body1">{uiContext.i18n.translator('deliveryOptionsLabel')}</Typography>,
                      <Stack direction="row" gap="0.5rem" key="deliv">
                        { resource.data.canBeDelivered && <Chip label={uiContext.i18n.translator(resource.data.isProduct ? 'canBeDelivered' : 'placeToBeAgreed')}/> }
                        { resource.data.canBeTakenAway && <Chip label={uiContext.i18n.translator(resource.data.isProduct ? 'canBeTakenAway' : 'onSite')}/> }
                      </Stack>)
                    }
                    return fields
                  })()}
                    <Feedback testID="CreateBidSuccess" sx={{ position: 'fixed', bottom: '1rem' }} severity="success" message={uiContext.i18n.translator('bidCreationSuccessMessage')} onClose={() => setBidCreationSucceeded(false)}
                      visible={bidCreationSucceeded}/>
                </Stack>
                <CreateBidDialog resource={resourceToBidOn} onClose={success => {
                  setResourceToBidOn(undefined)
                  setBidCreationSucceeded(!!success)
                }} />
              </Stack>
            )
          }

          return elements
        })()}
      </Stack>
      { resource?.data?.specificLocation &&
        <DisplayLocation key="loc" value={resource.data.specificLocation}/>
      }
      <ZoomedImageDialog zoomedImg={zoomedImg} onClose={() => setZoomedImg(undefined)} />
      <ConnectDialog onClose={() => setConnecting(false)} version={uiContext.version} visible={connecting} />
    </LoadedZone>
}

export default ViewResource