import { Button, Card, CardActions, CardContent, IconButton, Typography } from '@mui/material'
import { Stack } from '@mui/material'
import { useContext, useState } from 'react'
import PlusIcon from '@mui/icons-material/Add'
import CampaignIcon from '@/app/img/campaign.svg'
import QuestionMarkIcon from '@mui/icons-material/QuestionMark'
import RefreshIcon from '@mui/icons-material/Refresh'
import { gql, useMutation, useQuery } from '@apollo/client'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PictureGallery from '../scaffold/PictureGallery'
import { urlFromPublicId } from '@/lib/images'
import ExpirationIndicator from './ExpirationIndicator'
import { ConfirmDialog, ZoomedImageDialog } from '../misc'
import Link from 'next/link'
import { UiContext } from '../scaffold/UiContextProvider'
import LoadedList from '../scaffold/LoadedList'
import { primaryColor } from '@/utils'
import dayjs from 'dayjs'
import useActiveCampaign from '@/lib/useActiveCampaign'
import ExplainCampaignDialog from '../user/ExplainCampaignDialog'

export const RESOURCES = gql`query MyResources {
    myResources {
      nodes {
        id
        expiration
        description
        created
        isProduct
        isService
        title
        canBeTakenAway
        canBeExchanged
        canBeGifted
        canBeDelivered
        deleted
        price
        accountByAccountId {
          id
          name
          email
        }
        resourcesImagesByResourceId {
          nodes {
            imageByImageId {
              created
              id
              publicId
            }
          }
        }
        resourcesResourceCategoriesByResourceId {
          nodes {
            resourceCategoryCode
          }
        }
        locationBySpecificLocationId {
          address
          id
          latitude
          longitude
        }
      }
    }
}`

export const DELETE_RESOURCE = gql`mutation DeleteResource($resourceId: Int) {
  deleteResource(input: {resourceId: $resourceId}) {
    integer
  }
}`

interface ResourceCardProps {
  id: number
  deleted: boolean
  onImageClicked?: (uri: string) => void
  onDeleteRequested?: () => void
  expiration?: Date
  title: string
  images: { alt: string, uri: string }[]
  isExample?: boolean
}

const ResourceCard = (p: ResourceCardProps) => {
  const uiContext = useContext(UiContext)
  return <Stack sx={theme => ({
      backgroundColor: p.deleted ? theme.palette.primary.light: 'inherit',
      position: 'relative',
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
      } })}>
    <Card key={p.id} sx={{
      opacity: p.isExample ? '0.6': 'inherit',
      }}>
      <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <Typography component="p" lineHeight="1rem" textAlign="center" variant="overline">{`${p.deleted ? `(${uiContext.i18n.translator('deletedLabel')})` : ''} ${p.title}`}</Typography>
          <ExpirationIndicator value={p.expiration} />
          <PictureGallery sx={{ justifyContent: "center" }}
              images={p.images}
              onImageClicked={p.onImageClicked ? img => p.onImageClicked!(img.uri) : undefined} />
      </CardContent>
      <CardActions sx={{ justifyContent: 'space-around' }}>
          <Button startIcon={<EditIcon/>}>
            { p.isExample ? uiContext.i18n.translator('modifyButtonCaption') : <Link href={{ pathname: `/webapp/${uiContext.version}/resources/${p.id}` }}>{uiContext.i18n.translator('modifyButtonCaption')}</Link> }
          </Button>
          <Button onClick={() => {
            p.onDeleteRequested && p.onDeleteRequested()
          }} startIcon={<DeleteIcon/>}>{uiContext.i18n.translator('deleteButtonCaption')}</Button>
      </CardActions>
    </Card>
    { p.isExample && <Typography color="primary.contrastText" 
      sx={{ backgroundColor: primaryColor, position: 'absolute', top: '3rem', left: '2rem', transform: 'rotate(-13deg)', padding: '0rem 0.5rem' }} 
      variant="overline">
      {uiContext.i18n.translator('ExampleLabel')}
    </Typography>}
  </Stack>
}

const ExampleResources = () => {
  const uiContext = useContext(UiContext)
  return <Stack alignItems="center">
    <Typography variant="overline">{uiContext.i18n.translator('noResourceYet')}</Typography>
    <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', overflow: 'auto' }}>
      <ResourceCard id={1} deleted={false} title={uiContext.i18n.translator('childClothExampleResourceTitle')}
        expiration={dayjs().add(10, 'days').toDate()}
        images={[{ alt: 'example picture', uri: urlFromPublicId('uyn4yzdh6iiqzkrd33py') }]}
        isExample />
      <ResourceCard id={2} deleted={false} title={uiContext.i18n.translator('mangasResourceTitle')}
        expiration={dayjs().add(20, 'days').toDate()}
        images={[{ alt: 'example picture', uri: urlFromPublicId('he265cbgcsaqegbdsxy8') }]}
        isExample />
      <ResourceCard id={3} deleted={false} title={uiContext.i18n.translator('equipmentForRentResourceTitle')}
        expiration={undefined}
        images={[{ alt: 'example picture', uri: urlFromPublicId('jqmyhsmx1led7nhvilp3') }]}
        isExample />
    </Stack>
  </Stack>
}
const Resources = () => {
    const uiContext = useContext(UiContext)
    const {data, loading, error, refetch} = useQuery(RESOURCES, { fetchPolicy: 'no-cache' })
    const [zoomedImg, setZoomedImg] = useState<string | undefined>('')
    const [deletingResourceId, setDeletingResourceId] = useState<number | undefined>(undefined)
    const [deleteResource] = useMutation(DELETE_RESOURCE)
    const { activeCampaign } = useActiveCampaign()
    const [explainingCampaign, setExplainingCampaign] = useState(false)

    return <Stack gap="1rem" overflow="auto">
        { activeCampaign.data && <Stack direction="row" justifyContent="center" alignItems="center" gap="0.25rem">
            <Button variant="contained" startIcon={<PlusIcon/>} endIcon={<CampaignIcon height="3rem" width="3rem"/>} >
              <Link href={{ pathname: `/webapp/${uiContext.version}/resources/0`, query: 'campaign=1' }}>
                <Stack>
                  <Typography variant="subtitle1">{activeCampaign.data.name}</Typography>
                  <Typography variant="body1">{`${uiContext.i18n.translator('rewards')} X ${activeCampaign.data.resourceRewardsMultiplier}`}</Typography>
                </Stack>
              </Link>
            </Button>
            <IconButton color="primary" onClick={() => setExplainingCampaign(true)}>
                <QuestionMarkIcon/>
            </IconButton>
        </Stack>}
        <Stack direction="row" justifyContent="center" alignItems="center" gap="1rem">
            <Button variant="outlined" startIcon={<PlusIcon/>}>
              <Link href={{ pathname: `/webapp/${uiContext.version}/resources/0` }}>{uiContext.i18n.translator('addResourceButtonCaption')}</Link>
            </Button>
            <IconButton color="primary" onClick={() => refetch()}>
                <RefreshIcon/>
            </IconButton>
        </Stack>
        <LoadedList loading={loading} error={error} items={(data && data.myResources && data.myResources.nodes) || []}
            containerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem', overflow: 'auto' }} 
            renderNoData={ExampleResources}
            renderItem={(res: any) => <ResourceCard key={res.id} id={res.id} deleted={res.deleted} title={res.title} 
              expiration={res.expiration} onImageClicked={(uri: string) => setZoomedImg(uri)}
              onDeleteRequested={() => setDeletingResourceId(res.id)}
              images={res.resourcesImagesByResourceId.nodes.map((img: any, idx: number) => ({ alt: idx, uri: urlFromPublicId(img.imageByImageId.publicId) }))}/>}
        />
        <ZoomedImageDialog zoomedImg={zoomedImg} onClose={() => setZoomedImg('')} />
        <ExplainCampaignDialog visible={explainingCampaign} onClose={() => setExplainingCampaign(false)} />
        <ConfirmDialog visible={!!deletingResourceId} onClose={async res => {
          if(res) {
            await deleteResource({ variables: { resourceId: deletingResourceId }})
            refetch()
          }
          setDeletingResourceId(undefined)
        }} title={uiContext.i18n.translator('confirmDeleteResourceTitle')} />
    </Stack>
}

export default Resources