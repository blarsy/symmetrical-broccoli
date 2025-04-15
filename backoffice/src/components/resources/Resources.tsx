import { Button, Card, CardActions, CardContent, CardHeader, Dialog, IconButton, Typography } from '@mui/material'
import { Stack } from '@mui/system'
import { useContext, useState } from 'react'
import { AppContext } from '../scaffold/AppContextProvider'
import PlusIcon from '@mui/icons-material/Add'
import RefreshIcon from '@mui/icons-material/Refresh'
import { gql, useMutation, useQuery } from '@apollo/client'
import LoadedZone from '../scaffold/LoadedZone'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PictureGallery from '../scaffold/PictureGallery'
import { urlFromPublicId } from '@/lib/images'
import ExpirationIndicator from './ExpirationIndicator'
import { ConfirmDialog } from '../misc'
import Link from 'next/link'

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
        suspended
        subjectiveValue
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

const Resources = () => {
    const appContext = useContext(AppContext)
    const {data, loading, error, refetch} = useQuery(RESOURCES, { fetchPolicy: 'no-cache' })
    const [zoomedImg, setZoomedImg] = useState<string | undefined>('')
    const [deletingResourceId, setDeletingResourceId] = useState<number | undefined>(undefined)
    const [deleteResource, { loading: deleting, error: deleteError}] = useMutation(DELETE_RESOURCE)

    return <Stack gap="1rem">
        <Stack direction="row" justifyContent="center" alignItems="center" gap="1rem">
            <Button variant="contained" startIcon={<PlusIcon/>}>
              <Link href={{ pathname: `/webapp/${appContext.version}/resources/0` }}>{appContext.i18n.translator('addResourceButtonCaption')}</Link>
            </Button>
            <IconButton color="primary" onClick={() => refetch()}>
                <RefreshIcon/>
            </IconButton>
        </Stack>
        <LoadedZone loading={loading} error={error} 
            containerStyle={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            { data && data.myResources.nodes.map((res: any) => <Card key={res.id} sx={theme => ({
                backgroundColor: res.deleted ? theme.palette.primary.light: 'inherit',
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
                } })}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <Typography noWrap component="p" lineHeight="1rem" textAlign="center" variant="overline">{`${res.deleted ? `(${appContext.i18n.translator('deletedLabel')})` : ''} ${res.title}`}</Typography>
                    <ExpirationIndicator value={res.expiration} />
                    <PictureGallery sx={{ justifyContent: "center" }} 
                        images={res.resourcesImagesByResourceId.nodes.map((img: any, idx: number) => ({ alt: idx, uri: urlFromPublicId(img.imageByImageId.publicId) }))}
                        onImageClicked={img => setZoomedImg(img.uri)} />
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-around' }}>
                    <Button startIcon={<EditIcon/>}>
                      <Link href={{ pathname: `/webapp/${appContext.version}/resources/${res.id}` }}>{appContext.i18n.translator('modifyButtonCaption')}</Link>
                    </Button>
                    <Button onClick={() => {

                    }} startIcon={<DeleteIcon/>}>{appContext.i18n.translator('deleteButtonCaption')}</Button>
                </CardActions>
            </Card>) }
            <Dialog open={!!zoomedImg} onClose={() => setZoomedImg('')} fullScreen>
                <Stack sx={{ height: '100vh', backgroundColor: 'transparent', alignItems: 'center' }} onClick={() => setZoomedImg(undefined)}>
                    <img src={zoomedImg} style={{ height: 'inherit', width: 'auto' }} />
                </Stack>
            </Dialog>
            <ConfirmDialog processing={deleting} error={deleteError} visible={!!deletingResourceId} onClose={async res => {
              if(res) {
                await deleteResource({ variables: { resourceId: deletingResourceId }})
              }
              setDeletingResourceId(undefined)
            }} title={appContext.i18n.translator('confirmDeleteResourceTitle')} />
        </LoadedZone>
    </Stack>
}

export default Resources