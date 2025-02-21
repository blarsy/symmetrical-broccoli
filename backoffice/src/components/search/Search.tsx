import { gql, useMutation } from "@apollo/client"
import LoadedZone from "../scaffold/LoadedZone"
import { useState } from "react"
import { Avatar, Card, CardContent, CardHeader, Dialog, Stack, useTheme } from "@mui/material"
import { urlFromPublicId } from "@/lib/images"
import PictureGallery from "../scaffold/PictureGallery"
import SearchFilter, { SearchParameters } from "./SearchFilter"

export const SUGGEST_RESOURCES = gql`mutation SuggestResources($canBeDelivered: Boolean, $canBeExchanged: Boolean, $canBeGifted: Boolean, $canBeTakenAway: Boolean, $categoryCodes: [Int], $excludeUnlocated: Boolean = false, $isProduct: Boolean, $isService: Boolean, $referenceLocationLatitude: BigFloat = "0", $referenceLocationLongitude: BigFloat = "0", $searchTerm: String, $distanceToReferenceLocation: BigFloat = "0") {
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

const makeAvatarLetters = (name: string) =>
    name.split(/[ -]/, 2).map(word => word[0]).join('').toLocaleUpperCase()
const AccountAvatar = ({name, avatarImagePublicId}:{ name: string, avatarImagePublicId: string}) => {
    if(avatarImagePublicId) {
        return <Avatar src={urlFromPublicId(avatarImagePublicId)} alt={name} />
    }
    return <Avatar alt={name}>{makeAvatarLetters(name)}</Avatar>
}

const DEFAULT_SEARCH_PARAMETERS: SearchParameters = { canBeDelivered: false, canBeExchanged: false, 
  canBeGifted: false, canBeTakenAway: false, isProduct: false, isService: false, categoryCodes: [], 
  excludeUnlocated: false, referenceLocation: null, distanceToReferenceLocation: 50, searchTerm: '' }


const Search = () => {
    const [ suggestResources, { loading, error }] = useMutation(SUGGEST_RESOURCES)
    const [suggestedResources, setSuggestedResources] = useState<any[]>([])
    const [zoomedImg, setZoomedImg] = useState('')
    const theme = useTheme()

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

    return <Stack sx={{ padding: '2rem', gap: '2rem' }}>
        <SearchFilter value={DEFAULT_SEARCH_PARAMETERS} onParamsChanged={async searchParams => {
            loadResources(searchParams)
        }} />
        <LoadedZone loading={loading} error={error} 
            containerStyle={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', 
                gap: '1rem', justifyContent: 'center' }}>
            { suggestedResources.map((res: any)=> <Card key={res.id} sx={{
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
                }
            }}>
                <CardHeader avatar={<AccountAvatar name={res.accountByAccountId.name} avatarImagePublicId={res.accountByAccountId.imageByAvatarImageId?.publicId} />} title={res.title}/>
                { res.resourcesImagesByResourceId?.nodes.length > 0 && 
                    <PictureGallery sx={{ justifyContent: "center" }} images={res.resourcesImagesByResourceId.nodes.map((img: any, idx: number) => ({ alt: idx, uri: urlFromPublicId(img.imageByImageId.publicId) }))}
                        onImageClicked={img => setZoomedImg(img.uri)} />}

                <CardContent>{res.description}</CardContent>
            </Card>) }
            <Dialog open={!!zoomedImg} onClose={() => setZoomedImg('')} fullScreen>
                <Stack sx={{ height: '100vh', backgroundColor: 'transparent', alignItems: 'center' }} onClick={() => setZoomedImg('')}>
                    <img src={zoomedImg} style={{ height: 'inherit', width: 'auto' }} />
                </Stack>
            </Dialog>
        </LoadedZone>
    </Stack> 
}

export default Search