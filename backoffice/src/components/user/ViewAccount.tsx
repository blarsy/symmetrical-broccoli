"use client"
import { IconButton, Link, Stack, Typography } from "@mui/material"
import LoadedZone from "../scaffold/LoadedZone"
import { useQuery } from "@apollo/client"
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
import { GET_ACCOUNT_PUBLIC_INFO } from "@/lib/apolloClient"
import { urlFromPublicId } from "@/lib/images"
import { fonts } from "@/theme"
import { AppContext } from "../scaffold/AppContextProvider"

interface Props {
    accountId: number
    version: string
}

const ViewAccount = (p: Props) => {
    const { data, loading, error } = useQuery(GET_ACCOUNT_PUBLIC_INFO, { variables: { id: p.accountId } })
    const uiContext = useContext(UiContext)
    const appContext = useContext(AppContext)
    const [tokenTransferInfo, setTokenTransferInfo] = useState<TokenTransferInfo>()
    const [accountResources, setAccountResources] = useState<Resource[]>([])
    useCategories()

    useEffect(() => {
        if(data && data.getAccountPublicInfo.resourcesByAccountId.nodes && uiContext.categories.data) {
            setAccountResources(data.getAccountPublicInfo.resourcesByAccountId.nodes
                .filter((res: any) => !(res.deleted || (res.expiration && dayjs(res.expiration).toDate() < new Date())))
                .map((res:any) => fromServerGraphResource(res, uiContext.categories.data!)))
        }
    }, [data, uiContext.categories.data])

    return <LoadedZone loading={loading} error={error} containerStyle={{ 
        overflow: 'auto', paddingBottom: '1rem', paddingLeft: '2rem', paddingRight: '2rem', gap: '0.5rem'
      }}>
        { data && <>
            <Stack direction="row" gap="1rem" alignItems="center">
                <AccountAvatar sx={{ width: '3rem', height: '3rem' }} name={data.getAccountPublicInfo.name}
                    avatarImagePublicId={data.getAccountPublicInfo.imageByAvatarImageId?.publicId} />
                <Typography flex="1" color="primary" textTransform="uppercase" fontWeight="bold" fontFamily={fonts.title.style.fontFamily} fontSize="3rem" textAlign="center">{data.getAccountPublicInfo.name}</Typography>
                {appContext.account?.id != data.getAccountPublicInfo.id && <IconButton color="primary" onClick={() => {
                  setTokenTransferInfo({ destinatorAccount: data.getAccountPublicInfo.name, 
                    destinatorId: data.getAccountPublicInfo.id
                  })
                }}>
                  <GiveIcon sx={{ fontSize: '3rem' }} />
                </IconButton>}
            </Stack>
            { data.getAccountPublicInfo.imageByAvatarImageId?.publicId &&
                <Stack alignItems="center">
                    <img style={{ maxWidth: '400px', width: '100%' }} src={urlFromPublicId(data.getAccountPublicInfo.imageByAvatarImageId?.publicId)} />
                </Stack>
            }
            { data.getAccountPublicInfo.accountsLinksByAccountId && data.getAccountPublicInfo.accountsLinksByAccountId.nodes.length > 0 &&
                <Stack>
                    <Typography variant="caption" color="primary">{uiContext.i18n.translator('linksLabel')}</Typography>
                    {data.getAccountPublicInfo.accountsLinksByAccountId.nodes.map((link: any, idx: number) => <Link key={idx} href={link.url}>{link.label || link.url}</Link>) }
                </Stack>
            }
            { data.getAccountPublicInfo.locationByLocationId &&
                <Stack>
                    <Typography variant="caption" color="primary">{uiContext.i18n.translator('accountLocationLabel')}</Typography>
                    <DisplayLocation value={{ 
                      address: data.getAccountPublicInfo.locationByLocationId.address, 
                      latitude: Number(data.getAccountPublicInfo.locationByLocationId.latitude), 
                      longitude: Number(data.getAccountPublicInfo.locationByLocationId.longitude)}}/>
                </Stack>
            }
            <Typography variant="caption" color="primary">{uiContext.i18n.translator('availableResources')}</Typography>
            { accountResources.length === 0 ?
                <Typography variant="body1" textAlign="center" color="primary">{uiContext.i18n.translator('noResource')}</Typography>
                :
                <Stack direction="row" flexWrap="wrap" gap="1rem" justifyContent="center">
                    { accountResources.map((res, idx) => <ResourceCard testId={`ResCard${res.id}`}
                        key={idx} version={p.version} resource={{
                            id: res.id, title: res.title, description: res.description, expiration: res.expiration,
                            images: res.images.map((img) => img.publicId!), accountName: data.getAccountPublicInfo.name, 
                            avatarPublicId: data.getAccountPublicInfo.imageByAvatarImageId?.publicId
                        }}/>)}
                </Stack>
            } 
        </>}
        <TransferTokensDialog transferInfo={tokenTransferInfo} onClose={() => setTokenTransferInfo(undefined)} />
    </LoadedZone>
}

export default ViewAccount