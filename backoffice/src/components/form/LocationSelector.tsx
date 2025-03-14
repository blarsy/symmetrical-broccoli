import { getCommonConfig } from '@/config'
import {APIProvider, Map, Marker} from '@vis.gl/react-google-maps'
import { Location } from '@/lib/schema'
import { useContext, useEffect, useState } from 'react'
import { setDefaults, setLanguage, fromLatLng, OutputFormat } from "react-geocode"
import { AppContext } from '../scaffold/AppContextProvider'
import { Alert, CircularProgress, Stack, TextField } from '@mui/material'
import { primaryColor } from '@/utils'
import { DEFAULT_LOCATION_LAT_LNG } from '@/lib/constants'

const { mapsApiKey } = getCommonConfig()

setDefaults({
    language: 'fr', key: mapsApiKey, outputFormat: OutputFormat.JSON
})

interface Props {
    value: Location | null
    onLocationSet: (newLocation: Location) => void
}

const LocationSelector = (p: Props) => {
    const [currentLocation, setCurrentLocation] = useState<Location | null>(p.value)
    const [addressQueryState, setAddressQueryState] = useState<{ querying: boolean, error?: Error }>({ querying: false })
    const appContext = useContext(AppContext)

    useEffect(() => {
        setLanguage(appContext.i18n.lang)
    }, [])
    
    return <APIProvider apiKey={mapsApiKey}>
        <Stack sx={{ width: '100%', height: '100%', position: 'relative' }}>
            { addressQueryState.querying && <CircularProgress sx={{ zIndex: 1, position: 'absolute', top: '1rem', left: '1rem', color: primaryColor }} /> }
            { currentLocation?.address && <TextField sx={{ zIndex: 1, position: 'absolute', top: '1rem', left: '1rem', right: '1rem', backgroundColor: '#fff', input: { color: '#000', padding: '0.25rem' }, flex: 1 }} value={currentLocation.address} onChange={e => {
                setCurrentLocation(prev => {
                    const newLocation = { ...prev!, ...{ address: e.target.value }}
                    setTimeout(() => p.onLocationSet(newLocation), 0)
                    return newLocation
                })
            }}/> }
            <Map
                style={{width: '100%', height: '100%'}}
                defaultCenter={ p.value ? { lat: p.value.latitude, lng: p.value.longitude} : {lat: DEFAULT_LOCATION_LAT_LNG.latitude, lng: DEFAULT_LOCATION_LAT_LNG.longitude}}
                defaultZoom={16}
                onClick={e => {
                    if(e.detail.latLng) {
                        setCurrentLocation({ latitude: e.detail.latLng.lat, longitude: e.detail.latLng.lng, address: '' })
                        setAddressQueryState({ querying: true })
                        fromLatLng(e.detail.latLng.lat, e.detail.latLng.lng).then(
                            res => {
                                setAddressQueryState({ querying: false })
                                if(res.results && res.results.length > 0) {
                                    setCurrentLocation(prev => {
                                        const newLocation = { ...prev!, ...{ address: res.results[0].formatted_address }}
                                        setTimeout(() => p.onLocationSet(newLocation), 0)
                                        return newLocation
                                    })
                                }
                            },
                            err => setAddressQueryState({ querying: false, error: err })
                        )
                    }
                }}
                disableDefaultUI={true}>
                { currentLocation && <Marker position={{ lat: currentLocation.latitude, lng: currentLocation.longitude }}/>}
            </Map>
            { addressQueryState.error && <Alert severity="error" onClose={() => setAddressQueryState({ querying: false })}>{addressQueryState.error.message}</Alert> }
        </Stack>
    </APIProvider>
}

export default LocationSelector