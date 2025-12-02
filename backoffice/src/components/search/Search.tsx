import { gql, useMutation } from "@apollo/client"
import LoadedZone from "../scaffold/LoadedZone"
import { useContext, useEffect, useState } from "react"
import { Stack, Typography } from "@mui/material"
import SearchFilter, { SearchParameters } from "./SearchFilter"
import ResourceCard from "../resources/ResourceCard"
import { DEFAULT_LOCATION } from "@/lib/constants"
import { UiContext } from "../scaffold/UiContextProvider"
import { AppContext } from "../scaffold/AppContextProvider"
import useProfile from "@/lib/useProfile"

export const SUGGEST_RESOURCES = gql`mutation SuggestResources($canBeDelivered: Boolean, $canBeExchanged: Boolean, $canBeGifted: Boolean, $canBeTakenAway: Boolean, $categoryCodes: [Int], $excludeUnlocated: Boolean = false, $isProduct: Boolean, $isService: Boolean, $referenceLocationLatitude: BigFloat = "0", $referenceLocationLongitude: BigFloat = "0", $searchTerm: String, $distanceToReferenceLocation: BigFloat = "0", $inActiveCampaign: Boolean) {
  suggestedResources(
    input: {canBeDelivered: $canBeDelivered, canBeExchanged: $canBeExchanged, canBeGifted: $canBeGifted, canBeTakenAway: $canBeTakenAway, categoryCodes: $categoryCodes, distanceToReferenceLocation: $distanceToReferenceLocation, excludeUnlocated: $excludeUnlocated, isProduct: $isProduct, isService: $isService, referenceLocationLatitude: $referenceLocationLatitude, referenceLocationLongitude: $referenceLocationLongitude, searchTerm: $searchTerm, inActiveCampaign: $inActiveCampaign}
  ) {
    resources {
      accountByAccountId {
        name
        id
        imageByAvatarImageId {
          publicId
        }
      }
      created
      description
      title
      expiration
      canBeExchanged
      canBeGifted
      resourcesImagesByResourceId {
        nodes {
          imageByImageId {
            publicId
          }
        }
      }
      id
      resourcesResourceCategoriesByResourceId {
        nodes {
          resourceCategoryCode
        }
      }
    }
  }
}`

export const DEFAULT_SEARCH_PARAMETERS: SearchParameters = { canBeDelivered: false, canBeExchanged: false, 
  canBeGifted: false, canBeTakenAway: false, isProduct: false, isService: false, categoryCodes: [], 
  excludeUnlocated: false, distanceToReferenceLocation: 50, searchTerm: '', referenceLocation: DEFAULT_LOCATION,
  inCurrentCampaign: false }

const Search = (p: {version: string}) => {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    const { profileData } = useProfile()
    const [ suggestResources, { loading, error }] = useMutation(SUGGEST_RESOURCES)
    const [suggestedResources, setSuggestedResources] = useState<any[]>([])
    const [initialSearchParams, setInitialSearchParams] = useState(DEFAULT_SEARCH_PARAMETERS)
    const [loadingProfile, setLoadingProfile] = useState(true)
    const [initialLoading, setInitialLoading] = useState(true)

    useEffect(() => {
      if(!appContext.account) {
        setLoadingProfile(false)
        return
      }
      if(!profileData.loading) {
        if(profileData.data?.location) {
          setInitialSearchParams({ ...DEFAULT_SEARCH_PARAMETERS, ...{ referenceLocation: profileData.data.location } })
        }
        setLoadingProfile(false)
      }
    }, [profileData.data])

    const loadResources = async (searchParameters: SearchParameters) => {
      const res = await suggestResources({ variables: { 
          canBeDelivered: searchParameters.canBeDelivered, canBeExchanged: searchParameters.
          canBeExchanged, canBeGifted: searchParameters.canBeGifted, canBeTakenAway: searchParameters.canBeTakenAway, 
          categoryCodes: searchParameters.categoryCodes, distanceToReferenceLocation: searchParameters.distanceToReferenceLocation,
          excludeUnlocated: searchParameters.excludeUnlocated, isProduct: searchParameters.isProduct, 
          isService: searchParameters.isService, referenceLocationLatitude: searchParameters.referenceLocation?.latitude,
          referenceLocationLongitude: searchParameters.referenceLocation?.longitude, 
          searchTerm: searchParameters.searchTerm, inActiveCampaign: searchParameters.inCurrentCampaign
       } })
      setSuggestedResources(res.data.suggestedResources.resources)
      setInitialLoading(false)
    }

    return <Stack sx={{ paddingTop: '2rem', gap: '2rem', overflow: 'auto' }}>
        <LoadedZone loading={ loadingProfile } error={ profileData.error }>
          { !loadingProfile && <SearchFilter value={initialSearchParams} onParamsChanged={async searchParams => {
              loadResources(searchParams)
          }} />}
        </LoadedZone>
        <LoadedZone loading={loading} error={error} 
            containerStyle={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', 
                gap: '1rem', justifyContent: 'center', overflow: 'auto' }}>
            { (suggestedResources.length === 0 && !initialLoading) ?
                <Typography variant="subtitle1" textAlign="center">{uiContext.i18n.translator('noResultFound')}</Typography>
              :
              suggestedResources.map((res: any, idx)=> <ResourceCard testId={`SearchResult:${res.id}`} key={idx} version={p.version}
                resource={{
                  id: res.id, accountName: res.accountByAccountId.name, description: res.description,
                  title: res.title, expiration: res.expiration, images: res.resourcesImagesByResourceId.nodes.map((img: any) => img.imageByImageId.publicId),
                  avatarPublicId: res.accountByAccountId.imageByAvatarImageId?.publicId, accountId: res.accountByAccountId.id
                }}/>)
            }
        </LoadedZone>
    </Stack> 
}

export default Search