import { gql, useMutation } from "@apollo/client"
import LoadedZone from "../scaffold/LoadedZone"
import { useState } from "react"
import { Stack } from "@mui/material"
import SearchFilter, { SearchParameters } from "./SearchFilter"
import ResourceCard from "../resources/ResourceCard"

export const SUGGEST_RESOURCES = gql`
  mutation SuggestResources($canBeDelivered: Boolean, $canBeExchanged: Boolean, $canBeGifted: Boolean, $canBeTakenAway: Boolean, $categoryCodes: [Int], $excludeUnlocated: Boolean = false, $isProduct: Boolean, $isService: Boolean, $referenceLocationLatitude: BigFloat = "0", $referenceLocationLongitude: BigFloat = "0", $searchTerm: String, $distanceToReferenceLocation: BigFloat = "0") {
    suggestedResources(
      input: {canBeDelivered: $canBeDelivered, canBeExchanged: $canBeExchanged, canBeGifted: $canBeGifted, canBeTakenAway: $canBeTakenAway, categoryCodes: $categoryCodes, distanceToReferenceLocation: $distanceToReferenceLocation, excludeUnlocated: $excludeUnlocated, isProduct: $isProduct, isService: $isService, referenceLocationLatitude: $referenceLocationLatitude, referenceLocationLongitude: $referenceLocationLongitude, searchTerm: $searchTerm}
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
  excludeUnlocated: false, referenceLocation: null, distanceToReferenceLocation: 50, searchTerm: '' }


const Search = (p: {version: string}) => {
    const [ suggestResources, { loading, error }] = useMutation(SUGGEST_RESOURCES)
    const [suggestedResources, setSuggestedResources] = useState<any[]>([])

    const loadResources = async (searchParameters: SearchParameters) => {
      const res = await suggestResources({ variables: { 
          canBeDelivered: searchParameters.canBeDelivered, canBeExchanged: searchParameters.
          canBeExchanged, canBeGifted: searchParameters.canBeGifted, canBeTakenAway: searchParameters.canBeTakenAway, 
          categoryCodes: searchParameters.categoryCodes, distanceToReferenceLocation: searchParameters.distanceToReferenceLocation,
          excludeUnlocated: searchParameters.excludeUnlocated, isProduct: searchParameters.isProduct, 
          isService: searchParameters.isService, referenceLocationLatitude: searchParameters.referenceLocation?.latitude,
          referenceLocationLongitude: searchParameters.referenceLocation?.longitude, 
          searchTerm: searchParameters.searchTerm
       } })
      setSuggestedResources(res.data.suggestedResources.resources)
    }

    return <Stack sx={{ paddingTop: '2rem', gap: '2rem', overflow: 'auto' }}>
        <SearchFilter value={DEFAULT_SEARCH_PARAMETERS} onParamsChanged={async searchParams => {
            loadResources(searchParams)
        }} />
        <LoadedZone loading={loading} error={error} 
            containerStyle={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', 
                gap: '1rem', justifyContent: 'center', overflow: 'auto' }}>
            { suggestedResources.map((res: any, idx)=> <ResourceCard testId={`SearchResult:${res.id}`} key={idx} version={p.version}
              resource={{
                id: res.id, accountName: res.accountByAccountId.name, description: res.description,
                title: res.title, expiration: res.expiration, images: res.resourcesImagesByResourceId.nodes.map((img: any) => img.imageByImageId.publicId),
                avatarPublicId: res.accountByAccountId.imageByAvatarImageId?.publicId, accountId: res.accountByAccountId.id
              }}/>
            )}
        </LoadedZone>
    </Stack> 
}

export default Search