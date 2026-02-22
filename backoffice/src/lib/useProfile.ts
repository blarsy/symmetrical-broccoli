import { gql, useLazyQuery, useMutation } from "@apollo/client"
import { useContext, useEffect, useState } from "react"
import { Link, Location, parseLocationFromGraph } from "@/lib/schema"
import { AppContext } from "@/components/scaffold/AppContextProvider"
import DataLoadState, { fromData, fromError, initial } from "./DataLoadState"
import { UiContext } from "@/components/scaffold/UiContextProvider"
import { error } from "./logger"

export const GET_ACCOUNT_INFO = gql`query AccountInfoById {
    me {
      id
      accountsLinksByAccountId {
        nodes {
          label
          url
          id
          linkTypeByLinkTypeId {
            id
          }
        }
      }
      locationByLocationId {
        address
        latitude
        longitude
        id
      }
    }
}`

export const UPDATE_ACCOUNT_PUBLIC_INFO = gql`mutation UpdateAccountPublicInfo($links: [AccountLinkInput], $location: NewLocationInput = null) {
    updateAccountPublicInfo(input: {links: $links, location: $location}) {
      integer
    }
  }
`

interface ProfileData {
    links: Link[]
    location: Location | null
}

const emptyProfileData = { links: [], location: null, preferences: { chatMessageDaysSummary: 1, newResourcesDaysSummary: 1 }}

function useProfile () {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    const [getPublicInfo, { data: publicInfoData, error: publicInfoError }] = useLazyQuery(GET_ACCOUNT_INFO)
    const [updateAccountPublicInfo] = useMutation(UPDATE_ACCOUNT_PUBLIC_INFO)
    const [profileData, setProfileData] = useState<DataLoadState<ProfileData>>(initial(true, emptyProfileData))
    const [updateStatePublicInfo, setUpdateStatePublicInfo] = useState<DataLoadState<undefined>>()

    const updatePublicInfo = async(links: Link[],location: Location | null) => {
        setUpdateStatePublicInfo({ loading: true })
        try {
            await updateAccountPublicInfo({ variables: { 
                links: links.map(link => ({ label: link.label, url: link.url, linkTypeId: link.type })),
                location
            } })
            setUpdateStatePublicInfo({ loading: false })
        } catch (e) {
            error({ message: (e as Error).toString(), accountId: appContext.account?.id }, uiContext.version, true)
            setUpdateStatePublicInfo({ loading: false, error: e as Error })
        }
    }

    useEffect(() => {
        if(appContext.account && !publicInfoData) {
            getPublicInfo()
        }
    }, [appContext.account?.id])

    useEffect(() => {
        if(publicInfoData) {
            setProfileData(fromData({
                links: publicInfoData.me.accountsLinksByAccountId.nodes.map((raw: any) => ({
                    id: raw.id, label: raw.label, type: raw.linkTypeByLinkTypeId.id, url: raw.url
                } as Link)),
                location: parseLocationFromGraph(publicInfoData.me.locationByLocationId),
                preferences: {
                    chatMessageDaysSummary: 1,
                    newResourcesDaysSummary: 1
                }
            }))
        } else if(publicInfoError){
            setProfileData(fromError(publicInfoError, uiContext.i18n.translator('requestError')))
        } else {
            setProfileData(initial(true, profileData.data || emptyProfileData))
        }
    }, [publicInfoData, publicInfoError])

    return {
        profileData,
        updateStatePublicInfo,
        updatePublicInfo
    }
}

export default useProfile