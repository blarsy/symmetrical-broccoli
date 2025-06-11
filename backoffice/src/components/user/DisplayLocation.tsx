import { OutputFormat, setDefaults } from "react-geocode"
import {APIProvider, Map, Marker} from '@vis.gl/react-google-maps'
import { Location } from '@/lib/schema'
import { getCommonConfig } from "@/config"
import { IconButton, Stack, Typography } from "@mui/material"
import Edit from "@mui/icons-material/Edit"
import Delete from "@mui/icons-material/Delete"

const { mapsApiKey } = getCommonConfig()

setDefaults({
    language: 'fr', key: mapsApiKey, outputFormat: OutputFormat.JSON
})

interface Props {
    value: Location
    editMode?: boolean
    onEditRequested?: () => void
    onDeleteRequested?: () => void
}

const DisplayLocation = (p: Props) => {
    return <>
        { p.editMode ?
            <Stack direction="row" gap="3px" justifyContent="center" alignItems="center">
                <Typography variant="body1" color="primary">{p.value.address}</Typography>
                <IconButton onClick={p.onEditRequested}><Edit/></IconButton>
                <IconButton onClick={p.onDeleteRequested}><Delete/></IconButton>
            </Stack>
        :
            <Typography textAlign="center" variant="body1" color="primary">{p.value.address}</Typography>
        }
        <Stack sx={theme => ({ 
            height: '500px', 
            minHeight: '500px', 
            width: '900px',
            alignSelf: 'center',
            [theme.breakpoints.down('lg')]: {
                height: '400px', 
                minHeight: '400px', 
                width: '700px',
            },[theme.breakpoints.down('md')]: {
                height: '300px', 
                minHeight: '300px', 
                width: '450px',
            },[theme.breakpoints.down('sm')]: {
                height: '200px', 
                minHeight: '200px', 
                width: '100%',
            }
        })}>
            <APIProvider apiKey={mapsApiKey}>
                <Map
                    defaultCenter={{ lat: p.value.latitude, lng: p.value.longitude}}
                    defaultZoom={16}
                    disableDefaultUI={true}>
                    <Marker position={{ lat: p.value.latitude, lng: p.value.longitude }}/>
                </Map>
            </APIProvider>
        </Stack>
    </>
}

export default DisplayLocation