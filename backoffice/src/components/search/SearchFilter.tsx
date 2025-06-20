import { Button, InputAdornment, OutlinedInput, Typography, Checkbox, FormControlLabel, IconButton } from "@mui/material"
import { Stack } from "@mui/system"
import { useContext, useEffect, useState } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import ExpandMore from '@mui/icons-material/ExpandMore'
import ExpandLess from '@mui/icons-material/ExpandLess'
import Close from '@mui/icons-material/Close'
import Search from '@mui/icons-material/Search'
import { primaryColor } from "@/utils"
import CategoriesSelector from "../form/CategoriesSelector"
import { Location } from "@/lib/schema"
import ResourceAttributesFilter from "./ResourceAttributesFilter"
import ProximityFilter from "./ProximityFilter"
import { useDebounce } from "use-debounce"
import { UiContext } from "../scaffold/UiContextProvider"

export interface SearchParameters {
    canBeDelivered: boolean
    canBeExchanged: boolean
    canBeGifted: boolean
    canBeTakenAway: boolean
    categoryCodes: number[]
    excludeUnlocated: boolean
    referenceLocation: Location | null
    distanceToReferenceLocation: number
    isProduct: boolean
    isService: boolean
    searchTerm: string
}

interface Props {
    value: SearchParameters
    onParamsChanged: (params: SearchParameters) => void
}

const SearchFilter = (p: Props) => {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    const [searchParameters, setSearchParameters] = useState(p.value)
    const [debouncedSearchParameters] = useDebounce(searchParameters, 700)
    const [showOptions, setShowOptions] = useState(false)

    const setParams = (param: any) => {
        setSearchParameters(prev => ({ ...prev, ...param }))
    }

    useEffect(() => {
        p.onParamsChanged(debouncedSearchParameters!)
    }, [debouncedSearchParameters])
    
    return <Stack flex="1" paddingLeft="2rem" paddingRight="2rem">
        <Stack direction="row">
            <Button variant="contained" endIcon={showOptions ? <ExpandLess /> : <ExpandMore />} onClick={e => setShowOptions(prev => !prev)}>
                {uiContext.i18n!.translator('moreOptions')}
            </Button>
            <OutlinedInput endAdornment={<InputAdornment position="end">
                <Search sx={{ color: primaryColor}}/>
            </InputAdornment> } sx={{ flex: 1  }} id="search" name="search" value={searchParameters.searchTerm} 
                onChange={e => setParams({ searchTerm: e.target.value || '' })}></OutlinedInput>
        </Stack>
        { showOptions && <Stack sx={theme => ({
            bgcolor: 'secondary',
            flexDirection:  'row',
            alignItems: 'inherit',
            padding: '0.5rem',
            position: 'relative',
            [theme.breakpoints.down('md')]: {
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
            }
        })}>
            <IconButton onClick={() => setShowOptions(false)} sx={{position: 'absolute', right: 0}}>
                <Close/>
            </IconButton>
            <ResourceAttributesFilter sx={{ flex: 1 }} searchParameters={searchParameters} onChange={setParams} />
            <Stack sx={{ flex: 1, alignItems: 'center' }}>
                <Typography variant="h4" textAlign="center" color="primary">{uiContext.i18n.translator('categoriesTitle')}</Typography>
                <CategoriesSelector values={searchParameters.categoryCodes} onSelectionChanged={selectedCats => setParams({ categoryCodes: selectedCats })}/>
            </Stack>
            <ProximityFilter sx={{ flex: 1 }}
                value={{ distanceToReferenceLocation: searchParameters.distanceToReferenceLocation, 
                    excludeUnlocated: searchParameters.excludeUnlocated, 
                    referenceLocation: searchParameters.referenceLocation }}
                onChange={(proximityParams) => setParams({ 
                    distanceToReferenceLocation: proximityParams.distanceToReferenceLocation, 
                    excludeUnlocated: proximityParams.excludeUnlocated,
                    referenceLocation: proximityParams.referenceLocation
                })} />
        </Stack>}
    </Stack>
}

export default SearchFilter