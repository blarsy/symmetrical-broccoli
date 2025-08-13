import { IconButton, Link, Stack, Typography } from "@mui/material"
import LoadedZone from "../scaffold/LoadedZone"
import { gql, useQuery } from "@apollo/client"
import { useContext, useEffect, useState } from "react"
import DisplayLocation from "./DisplayLocation"
import { AccountAvatar } from "../misc"
import ResourceCard from "../resources/ResourceCard"
import { UiContext } from "../scaffold/UiContextProvider"
import GiveIcon from '@mui/icons-material/VolunteerActivism'
import TransferTokensDialog, { TokenTransferInfo } from "../token/TransferTokensDialog"
import { fromServerGraphResource, Resource } from "@/lib/schema"
import dayjs from "dayjs"
import useCategories from "@/lib/useCategories"

interface Props {
    accountId: number
    version: string
}

const GET_ACCOUNT = gql`query Account($id: Int!) {
    getAccountPublicInfo(id: $id) {
      email
      name
      id
      resourcesByAccountId(orderBy: CREATED_DESC) {
        nodes {
          id
          canBeGifted
          canBeExchanged
          title
          description
          deleted
          expiration
          suspended
          paidUntil
          resourcesImagesByResourceId {
            nodes {
              imageByImageId {
                publicId
              }
            }
          }
          resourcesResourceCategoriesByResourceId {
            nodes {
              resourceCategoryCode
            }
          }
          accountByAccountId {
            id
          }
        }
      }
      imageByAvatarImageId {
        publicId
      }
      accountsLinksByAccountId {
        nodes {
          id
          url
          label
          linkTypeByLinkTypeId {
            id
          }
        }
      }
      locationByLocationId {
        address
        id
        longitude
        latitude
      }
    }
  }`

const ViewAccount = (p: Props) => {
    const { data, loading, error } = useQuery(GET_ACCOUNT, { variables: { id: p.accountId } })
    const uiContext = useContext(UiContext)
    const [tokenTransferInfo, setTokenTransferInfo] = useState<TokenTransferInfo>()
    const [accountResources, setAccountResources] = useState<Resource[]>([])
    useCategories()

    useEffect(() => {
        if(data && data.accountById.resourcesByAccountId.nodes && uiContext.categories.data) {
            setAccountResources(data.accountById.resourcesByAccountId.nodes
                .filter((res: any) => !res.deleted && dayjs(res.expiration).toDate() > new Date())
                .map((res:any) => fromServerGraphResource(res, uiContext.categories.data!)))
        }
    }, [data, uiContext.categories.data])

    return <LoadedZone loading={loading} error={error} containerStyle={{ 
        overflow: 'auto', paddingBottom: '1rem', paddingLeft: '2rem', paddingRight: '2rem', gap: '0.5rem'
      }}>
        { data && <>
            <Stack direction="row" gap="1rem" alignItems="center">
                <AccountAvatar sx={{ width: '3rem', height: '3rem' }} name={data.accountById.name}
                    avatarImagePublicId={data.accountById.imageByAvatarImageId?.publicId} />
                <Typography flex="1" color="primary" variant="h1">{data.accountById.name}</Typography>
                <IconButton color="primary" onClick={() => {
                  setTokenTransferInfo({ destinatorAccount: data.accountById.name, 
                    destinatorId: data.accountById.id
                  })
                }}>
                  <GiveIcon sx={{ fontSize: '3rem' }} />
                </IconButton>
            </Stack>
            { data.accountById.accountsLinksByAccountId && data.accountById.accountsLinksByAccountId.nodes.length > 0 &&
                <Stack>
                    <Typography variant="caption" color="primary">{uiContext.i18n.translator('linksLabel')}</Typography>
                    {data.accountById.accountsLinksByAccountId.nodes.map((link: any, idx: number) => <Link key={idx} href={link.url}>{link.label || link.url}</Link>) }
                </Stack>
            }
            { data.accountById.locationByLocationId &&
                <Stack>
                    <Typography variant="caption" color="primary">{uiContext.i18n.translator('accountLocationLabel')}</Typography>
                    <DisplayLocation value={{ 
                      address: data.accountById.locationByLocationId.address, 
                      latitude: Number(data.accountById.locationByLocationId.latitude), 
                      longitude: Number(data.accountById.locationByLocationId.longitude)}}/>
                </Stack>
            }
            <Typography variant="caption" color="primary">{uiContext.i18n.translator('availableResources')}</Typography>
            { accountResources.length === 0 ?
                <Typography variant="body1" textAlign="center" color="primary">{uiContext.i18n.translator('noResource')}</Typography>
                :
                <Stack direction="row" flexWrap="wrap" gap="1rem" justifyContent="center">
                    { accountResources.map((res, idx) => <ResourceCard 
                        key={idx} version={p.version} resource={{
                            id: res.id, title: res.title, description: res.description, expiration: res.expiration,
                            images: res.images.map((img) => img.publicId!)
                        }}/>)}
                </Stack>
            } 
        </>}
        <TransferTokensDialog transferInfo={tokenTransferInfo} onClose={() => setTokenTransferInfo(undefined)} />
    </LoadedZone>
}

export default ViewAccount