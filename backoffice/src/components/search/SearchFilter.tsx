import { Button, InputAdornment, OutlinedInput, Typography, IconButton, FormControlLabel, Checkbox, Divider } from "@mui/material"
import { Stack } from "@mui/system"
import { useContext, useEffect, useState } from "react"
import ExpandMore from '@mui/icons-material/ExpandMore'
import ExpandLess from '@mui/icons-material/ExpandLess'
import Close from '@mui/icons-material/Close'
import Search from '@mui/icons-material/Search'
import { lightPrimaryColor, primaryColor } from "@/utils"
import { Location } from "@/lib/schema"
import ResourceAttributesFilter from "./ResourceAttributesFilter"
import ProximityFilter from "./ProximityFilter"
import { useDebounce } from "use-debounce"
import { UiContext } from "../scaffold/UiContextProvider"
import { EditableChipList, EditableChipListOptions } from "./ChipList"
import useCategories from "@/lib/useCategories"
import CategoriesDialog from "../form/CategoriesDialog"
import useActiveCampaign from "@/lib/useActiveCampaign"
import MoreFilterIcon from '@mui/icons-material/Tune'

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
    inCurrentCampaign: boolean
}

interface Props {
    value: SearchParameters
    onParamsChanged: (params: SearchParameters) => void
}

const SearchFilter = (p: Props) => {
    const uiContext = useContext(UiContext)
    const { activeCampaign } = useActiveCampaign()
    const [searchParameters, setSearchParameters] = useState(p.value)
    const [selectingCategories, setSelectingCategories] = useState(false)
    const [debouncedSearchParameters] = useDebounce(searchParameters, 700)
    const [showOptions, setShowOptions] = useState(false)
    const categories = useCategories()

    const setParams = (param: any) => {
        setSearchParameters(prev => ({ ...prev, ...param }))
    }

    const catChipListFromCatCodes = (categoryCodes: number[]) => {
        const categoryOptions = {} as EditableChipListOptions
        categoryCodes.forEach(code => categoryOptions[code] = categories.data!.find(s => s.code === code)!.name)
        return categoryOptions
    }

    useEffect(() => {
        p.onParamsChanged(debouncedSearchParameters!)
    }, [debouncedSearchParameters])
    
    return <Stack flex="1" sx={theme => ({
        padding: '0 2rem',
        [theme.breakpoints.down('sm')]: {
            padding: '0.5rem'
        }
    })}>
        <Stack direction="row">
            <Button variant="contained" endIcon={showOptions ? <ExpandLess /> : <ExpandMore />} onClick={e => setShowOptions(prev => !prev)}>
                {/* {uiContext.i18n!.translator('moreOptions')} */}
                <MoreFilterIcon /> 
            </Button>
            <OutlinedInput data-testid="SearchText" endAdornment={<InputAdornment position="end">
                <Search sx={{ color: primaryColor}}/>
            </InputAdornment> } sx={{ flex: 1  }} id="search" name="search" value={searchParameters.searchTerm} 
                onChange={e => setParams({ searchTerm: e.target.value || '' })}></OutlinedInput>
        </Stack>
        { showOptions && <Stack sx={{ backgroundColor: uiContext.lightMode ? lightPrimaryColor : '#333' }}>
            <Stack sx={theme => ({
                bgcolor: 'secondary',
                flexDirection:  'row',
                alignItems: 'inherit',
                flexWrap: 'wrap',
                padding: '0.5rem',
                columnGap: '1rem',
                rowGap: '0.5rem',
                position: 'relative',
                [theme.breakpoints.down('sm')]: {
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem'
                }
            })}>
                <IconButton onClick={() => setShowOptions(false)} sx={{position: 'absolute', right: 0}}>
                    <Close/>
                </IconButton>
                <ResourceAttributesFilter sx={{ flex: 1 }} searchParameters={searchParameters} onChange={setParams} />
                <Stack alignItems="center">
                    <Typography variant="body1" color="primary">{uiContext.i18n.translator('categoriesTitle')}</Typography>
                    <Stack direction="row">
                        <EditableChipList options={catChipListFromCatCodes(searchParameters.categoryCodes)} 
                            onEditRequested={() => setSelectingCategories(true)} sx={{ gap: '0.25rem', flexWrap: 'wrap' }} 
                            onDeleteRequested={name => setParams({ categoryCodes: searchParameters.categoryCodes.filter(c => c.toString() != name) })}
                        />
                    </Stack>
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
            </Stack>
            { activeCampaign.data && <FormControlLabel control={
                <Checkbox size="small" sx={{ padding: '0 0.5rem 0 2rem' }} checked={searchParameters.inCurrentCampaign} onChange={e => {
                    setParams({ inCurrentCampaign: !searchParameters.inCurrentCampaign })
                }} />} label={uiContext.i18n.translator('inCurrentCampaign', { name: activeCampaign.data.name })} sx={{
                '& .MuiFormControlLabel-label': {
                    color: 'primary.contrastText'
                },
                backgroundColor: "primary", borderRadius: '0.5rem', padding: '0.25rem'
            }} />}
            <Divider />
        </Stack>}
        <CategoriesDialog visible={selectingCategories}
            value={searchParameters.categoryCodes.map(c => categories.data!.find(cat => cat.code === c)!)}
            onClose={cats => {
                if(cats) {
                    setParams({ categoryCodes: cats.map(c => c.code) })
                }
                setSelectingCategories(false)
            }} />
    </Stack>
}

export default SearchFilter