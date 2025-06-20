import { Checkbox, FormControlLabel, IconButton, Slider, Stack, SxProps, Theme, Typography } from "@mui/material"
import { useContext, useEffect, useState } from "react"
import EditIcon from '@mui/icons-material/EditOutlined'
import { Location } from '@/lib/schema'
import SetLocationDialog from "./SetLocationDialog"
import NoLocation from "./NoLocation"
import { UiContext } from "../scaffold/UiContextProvider"

interface ProximitySettingsProps {
    address: string
    distance: number
    excludeUnlocated: boolean
    onChange: (distance: number, excludeUnlocated: boolean) => void
    onSetNewLocationRequest: () => void
}

interface ProximityParameters {
    excludeUnlocated: boolean
    referenceLocation: Location | null
    distanceToReferenceLocation: number
}

const Settings = (p: ProximitySettingsProps) => {
    const uiContext = useContext(UiContext)

    return <Stack>
        <Typography variant="body1" color="primary">{`${p.distance} ${uiContext.i18n.translator('distanceTo')}`}</Typography>
        <Stack direction="row" alignItems="center" gap="1rem">
            <Typography variant="body1" color="primary">{p.address}</Typography>
            <IconButton onClick={p.onSetNewLocationRequest}>
                <EditIcon color="primary"/>
            </IconButton>
        </Stack>
        <Slider color="primary" min={1} max={50} value={p.distance} onChange={(e, val) => p.onChange(val as number, p.excludeUnlocated) } />
        <FormControlLabel control={<Checkbox checked={!p.excludeUnlocated} onChange={e => {
            p.onChange(p.distance, !p.excludeUnlocated)
        }} />} label={uiContext.i18n.translator('includeUnlocatedResourcesLabel')} sx={{
            '& .MuiFormControlLabel-label': {
                color: 'primary.main'
            }
        }}/>
    </Stack>
}

interface Props {
    value: ProximityParameters
    onChange: (newParams: ProximityParameters) => void
    sx?: SxProps<Theme>
}

const ProximityFilter = (p: Props) => {
    const uiContext = useContext(UiContext)
    const [currentParameters, setCurrentParameters] = useState(p.value)
    const [settingLocation, setSettingLocation] = useState(false)

    useEffect(() => {
        p.onChange(currentParameters)
    }, [currentParameters])

    return <Stack sx={p.sx} alignItems="center">
        <Typography variant="h4" textAlign="center" color="primary">{uiContext.i18n.translator('proximityTitle')}</Typography>
        { currentParameters.referenceLocation ? <Settings 
            address={ currentParameters.referenceLocation!.address } 
            distance={currentParameters.distanceToReferenceLocation} 
            excludeUnlocated={currentParameters.excludeUnlocated}
            onChange={(distance, excludeUnlocated) => setCurrentParameters(prev => ({...prev, ...{ distanceToReferenceLocation: distance, excludeUnlocated }}))}
            onSetNewLocationRequest={() => setSettingLocation(true)}/> 
            : 
            <NoLocation onLocationSetRequested={() => setSettingLocation(true)}/>}
        <SetLocationDialog visible={settingLocation} onClose={() => setSettingLocation(false)} 
            value={currentParameters.referenceLocation} onLocationSet={loc => {
                setCurrentParameters(prev => ({...prev, ...{ referenceLocation: loc }}))
            }} />
    </Stack>

}

export default ProximityFilter