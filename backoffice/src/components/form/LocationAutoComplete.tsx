import { DEFAULT_LOCATION_LAT_LNG } from "@/lib/constants"
import { Autocomplete, AutocompleteRenderInputParams, TextField } from "@mui/material"
import { CSSProperties, useContext, useEffect, useState } from "react"
import { useDebounce } from "use-debounce"
import { setLanguage } from "react-geocode"
import { Location } from "@/lib/schema"
import LoadedZone from "../scaffold/LoadedZone"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { UiContext } from "../scaffold/UiContextProvider"

interface DebouncedTextFieldProps {
    params: AutocompleteRenderInputParams
    label: string
    debounceDelay: number
    onChange: (newVal: string) => void
    value: string
}

const DebouncedTextField = (p: DebouncedTextFieldProps) => {
    const [currentValue, setCurrentValue] = useState(p.value)
    const [debouncedCurrentValue] = useDebounce(currentValue, p.debounceDelay)

    useEffect(() => {
        p.onChange(debouncedCurrentValue)
    }, [debouncedCurrentValue])
    return <TextField
        {...p.params}
        label={p.label}
        InputProps={{
            ...p.params.InputProps,
            type: 'search',
        }}
        onChange={e => {
            setCurrentValue(e.currentTarget.value)
        }}
        value={currentValue}
    />
} 

interface Props {
    value?: Location
    onChange: (newLocation: Location) => void
    style?: CSSProperties
}

const LocationAutoComplete = (p: Props) => {
    const uiContext = useContext(UiContext)
    const [suggestions, setSuggestions] = useState<google.maps.places.PlacePrediction[]>([])
    const [loadingState, setLoadingState] = useState(initial(true, undefined))
    
    const load = async () => {
        try {
            setLanguage(uiContext.i18n.lang)
            if(!google.maps.places) {
                await google.maps.importLibrary('places')
            }
            setLoadingState(fromData(undefined))
        } catch(e) {
            setLoadingState(fromError(e, uiContext.i18n.translator('reaquestError')))
        }
    }

    useEffect(() => {
        load()
    }, [])

    return <LoadedZone loading={loadingState.loading} error={loadingState.error}>
        <Autocomplete
            disableClearable
            style={p.style}
            value={p.value?.address || ''}
            freeSolo
            options={suggestions}
            getOptionLabel={o => {
                if(o instanceof google.maps.places.PlacePrediction) {
                    return o.text.text || ''
                }
                return o
            }}
            onChange={async (_, suggestion) => {
                if(suggestion instanceof google.maps.places.PlacePrediction){
                    const rawPlace = (suggestion as google.maps.places.PlacePrediction).toPlace()
                    const place = (await rawPlace.fetchFields({ fields: ['formattedAddress', 'location'] })).place
                    const result = { ...p.value, address: place.formattedAddress!} as Location
                    if(place.location) {
                        result.latitude = place.location.lat()
                        result.longitude = place.location.lng()
                    } else {
                        result.latitude = p.value?.latitude || DEFAULT_LOCATION_LAT_LNG.latitude
                        result.longitude = p.value?.longitude || DEFAULT_LOCATION_LAT_LNG.longitude
                    }
                    p.onChange(result)
                }
            }}
            
            renderInput={(params) => {
                return <DebouncedTextField params={params} debounceDelay={700}
                    value={p.value?.address || ''}
                    label={uiContext.i18n.translator('pleaseTypeTheAddress')}
                    onChange={newVal => {
                        p.onChange({ 
                            latitude: p.value?.latitude || DEFAULT_LOCATION_LAT_LNG.latitude,
                            longitude: p.value?.longitude || DEFAULT_LOCATION_LAT_LNG.longitude,
                            address: newVal
                        })
                        google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({ language: uiContext.i18n.lang, input: newVal })
                        .then(res => {
                            setSuggestions(res.suggestions.map(s => s.placePrediction!).filter(pp => pp.text && pp.text.text))
                        })
                    }} />
            }
        }/>
    </LoadedZone>
}

export default LocationAutoComplete