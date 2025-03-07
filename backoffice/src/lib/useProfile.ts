import { gql, useLazyQuery, useMutation } from "@apollo/client"
import { useContext, useEffect, useState } from "react"
import { Link, Location, parseLocationFromGraph } from "@/lib/schema"
import { AppContext } from "@/components/scaffold/AppContextProvider"
import DataLoadState, { fromData, fromError, initial } from "./DataLoadState"

export const GET_ACCOUNT_INFO = gql`query AccountInfoById($id: Int!) {
    accountById(id: $id) {
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

export const GET_PREFERENCES = gql`query Preferences($id: Int!) {
    accountById(id: $id) {
      id
      broadcastPrefsByAccountId {
        nodes {
          eventType
          id
          daysBetweenSummaries
        }
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

interface UseProfileData {
    profileData: DataLoadState<ProfileData>
    updatePublicInfo: {
        update: (links: Link[], location: Location | null) => Promise<void>,
        updating: boolean
        error?: Error
    }
}

const emptyProfileData = { links: [], location: null, preferences: { chatMessageDaysSummary: 1, newResourcesDaysSummary: 1 }}

const emptyUseProfileData: UseProfileData = {
    profileData: initial(true, emptyProfileData),
    updatePublicInfo: {
        update: async () => {},
        updating: false
    }
}

function useProfile () {
    const appContext = useContext(AppContext)
    const [getPublicInfo, { data: publicInfoData, error: publicInfoError }] = useLazyQuery(GET_ACCOUNT_INFO)
    const [updateAccountPublicInfo] = useMutation(UPDATE_ACCOUNT_PUBLIC_INFO)
    const [useProfileData, setUseProfileData] = useState<UseProfileData>(emptyUseProfileData)

    const updatePublicInfo = async(links: Link[],location: Location | null) => {
        setUseProfileData({
            profileData: useProfileData.profileData,
            updatePublicInfo: {
                update: updatePublicInfo, updating: true
            }
        })
        try {
            await updateAccountPublicInfo({ variables: { 
                links: links.map(link => ({ label: link.label, url: link.url, linkTypeId: link.type })),
                location
            } })
            setUseProfileData({
                profileData: fromData({
                    location,
                    links
                }),
                updatePublicInfo: {
                    update: updatePublicInfo, updating: false
                }
            })
        } catch (e) {
            setUseProfileData({
                profileData: useProfileData.profileData,
                updatePublicInfo: {
                    update: updatePublicInfo, updating: false, error: e as Error
                }
            })
        }
    }

    useEffect(() => {
        if(appContext.account && !publicInfoData) {
            getPublicInfo({ variables: { id: appContext.account!.id } })
        }
    }, [appContext.account?.id])

    useEffect(() => {
        if(publicInfoData) {
            setUseProfileData({
                profileData: fromData({
                    links: publicInfoData.accountById.accountsLinksByAccountId.nodes.map((raw: any) => ({
                        id: raw.id, label: raw.label, type: raw.linkTypeByLinkTypeId.id, url: raw.url
                    } as Link)),
                    location: parseLocationFromGraph(publicInfoData.accountById.locationByLocationId),
                    preferences: {
                        chatMessageDaysSummary: 1,
                        newResourcesDaysSummary: 1
                    }
                }),
                updatePublicInfo: { update: updatePublicInfo, updating: false }
            })
        } else if(publicInfoError){
            setUseProfileData({
                profileData: fromError(publicInfoError, appContext.i18n.translator('requestError')),
                updatePublicInfo: { update: updatePublicInfo, updating: false }
            })
        } else {
            setUseProfileData({ 
                profileData: initial(true, useProfileData.profileData.data || emptyProfileData),
                updatePublicInfo: { update: updatePublicInfo, updating: false }
             })
        }
    }, [publicInfoData, publicInfoError])

    return useProfileData
}

export default useProfile