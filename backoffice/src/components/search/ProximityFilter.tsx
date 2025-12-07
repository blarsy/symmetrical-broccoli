import { Checkbox, FormControlLabel, Icon, IconButton, Slider, Stack, SxProps, Theme, Tooltip, Typography } from "@mui/material"
import { useContext, useEffect, useState } from "react"
import EditIcon from '@mui/icons-material/EditOutlined'
import { Location } from '@/lib/schema'
import SetLocationDialog from "./SetLocationDialog"
import NoLocation from "./NoLocation"
import { UiContext } from "../scaffold/UiContextProvider"
import LocationSetIcon from '@mui/icons-material/LocationOn'
import LocationNotSetIcon from '@mui/icons-material/LocationOff'

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

    return <Stack direction="row" gap="1rem" flexWrap="wrap">
        <Stack direction="row" alignItems="center">
            <Typography variant="body1" color="primary">{p.address}</Typography>
            <IconButton onClick={p.onSetNewLocationRequest}>
                <EditIcon color="primary"/>
            </IconButton>
        </Stack>
        <Stack minWidth="8rem" alignItems="center">
            <Typography variant="body1" color="primary">{`${p.distance} ${uiContext.i18n.translator('distanceTo')}`}</Typography>
            <Slider color="primary" min={1} max={50} value={p.distance} onChange={(_e, val) => p.onChange(val as number, p.excludeUnlocated) } />
        </Stack>
        <Tooltip style={{ alignItems: 'flex-start' }} title={uiContext.i18n.translator('onlyLocatedResourcesLabel')}>
            <FormControlLabel control={<Checkbox sx={{ padding: '0 0 0 1rem' }} checked={p.excludeUnlocated} onChange={e => {
                p.onChange(p.distance, !p.excludeUnlocated)
            }} />} label={p.excludeUnlocated ? <LocationSetIcon/> : <LocationNotSetIcon />} sx={{
                '& .MuiFormControlLabel-label': {
                    color: 'primary.main',
                    display: 'flex'
                }
            }}/>
        </Tooltip>
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
        <Typography variant="body1" color="primary">{uiContext.i18n.translator('proximityTitle')}</Typography>
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