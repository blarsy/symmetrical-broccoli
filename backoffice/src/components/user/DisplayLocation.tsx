import { OutputFormat, setDefaults } from "react-geocode"
import {APIProvider, Map, Marker} from '@vis.gl/react-google-maps'
import { Location } from '@/lib/schema'
import { getCommonConfig } from "@/config"

const { mapsApiKey } = getCommonConfig()

setDefaults({
    language: 'fr', key: mapsApiKey, outputFormat: OutputFormat.JSON
})

interface Props {
    value: Location
}

const DisplayLocation = (p: Props) => {
    return <APIProvider apiKey={mapsApiKey}>
        <Map
            style={{width: '100%', height: '100%'}}
            defaultCenter={{ lat: p.value.latitude, lng: p.value.longitude}}
            defaultZoom={16}
            disableDefaultUI={true}>
            <Marker position={{ lat: p.value.latitude, lng: p.value.longitude }}/>
        </Map>
    </APIProvider>
}

export default DisplayLocation