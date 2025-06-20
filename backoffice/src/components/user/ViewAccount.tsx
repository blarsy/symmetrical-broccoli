import { Link, Stack, Typography } from "@mui/material"
import LoadedZone from "../scaffold/LoadedZone"
import { gql, useQuery } from "@apollo/client"
import { useContext } from "react"
import DisplayLocation from "./DisplayLocation"
import { AccountAvatar } from "../misc"
import ResourceCard from "../resources/ResourceCard"
import { UiContext } from "../scaffold/UiContextProvider"

interface Props {
    accountId: number
    version: string
}

const GET_ACCOUNT = gql`query Account($id: Int!) {
    accountById(id: $id) {
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

    return <LoadedZone loading={loading} error={error} containerStyle={{ 
        overflow: 'auto', paddingBottom: '1rem', paddingLeft: '2rem', paddingRight: '2rem', gap: '0.5rem'
      }}>
        { data && <>
            <Stack direction="row" gap="1rem" alignItems="center">
                <AccountAvatar sx={{ width: '3rem', height: '3rem' }} name={data.accountById.name}
                    avatarImagePublicId={data.accountById.imageByAvatarImageId?.publicId} />
                <Typography flex="1" color="primary" variant="h1">{data.accountById.name}</Typography>
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
            { data.accountById.resourcesByAccountId.nodes.length === 0 ?
                <Typography variant="body1" textAlign="center" color="primary">{uiContext.i18n.translator('noResource')}</Typography>
                :
                <Stack direction="row" flexWrap="wrap" gap="1rem" justifyContent="center">
                    { data.accountById.resourcesByAccountId.nodes.map((res: any, idx: number) => <ResourceCard 
                        key={idx} version={p.version} resource={{
                            id: res.id, title: res.title, description: res.description, expiration: res.expiration,
                            images: res.resourcesImagesByResourceId.nodes.map((img: any) => img.imageByImageId.publicId)
                        }}/>)}
                </Stack>
            } 
        </>}
    </LoadedZone>
}

export default ViewAccount