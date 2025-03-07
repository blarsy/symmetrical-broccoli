import { Checkbox, FormControlLabel, IconButton, Slider, Stack, SxProps, Theme, Typography } from "@mui/material"
import { useContext, useEffect, useState } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import Pin from '@/app/img/PIN.svg'
import { primaryColor } from "@/utils"
import EditIcon from '@mui/icons-material/EditOutlined'
import { Location } from '@/lib/schema'
import SetLocationDialog from "./SetLocationDialog"

interface ProximityParameters {
    excludeUnlocated: boolean
    referenceLocation: Location | null
    distanceToReferenceLocation: number
}

const NoLocation = (p: { onLocationSetRequested: () => void }) => {
    const appContext = useContext(AppContext)
    return <Stack>
        <Typography variant="body1" textAlign="center">{appContext.i18n.translator('noLocationSet')}</Typography>
        <IconButton onClick={p.onLocationSetRequested}>
            <Pin fill={ primaryColor } width="5rem" height="5rem" />
        </IconButton>
    </Stack>
}

interface ProximitySettingsProps {
    address: string
    distance: number
    excludeUnlocated: boolean
    onChange: (distance: number, excludeUnlocated: boolean) => void
    onSetNewLocationRequest: () => void
}

const Settings = (p: ProximitySettingsProps) => {
    const appContext = useContext(AppContext)

    return <Stack>
        <Typography variant="body1" color="secondary">{`${p.distance} ${appContext.i18n.translator('distanceTo')}`}</Typography>
        <Stack direction="row" alignItems="center" gap="1rem">
            <Typography variant="body1" color="secondary">{p.address}</Typography>
            <IconButton onClick={p.onSetNewLocationRequest}>
                <EditIcon color="secondary"/>
            </IconButton>
        </Stack>
        <Slider color="secondary" min={1} max={50} value={p.distance} onChange={(e, val) => p.onChange(val as number, p.excludeUnlocated) } />
        <FormControlLabel control={<Checkbox checked={!p.excludeUnlocated} onChange={e => {
            p.onChange(p.distance, !p.excludeUnlocated)
        }} />} label={appContext.i18n.translator('includeUnlocatedResourcesLabel')} sx={{
            '& .MuiFormControlLabel-label': {
                color: 'secondary.main'
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
    const appContext = useContext(AppContext)
    const [currentParameters, setCurrentParameters] = useState(p.value)
    const [settingLocation, setSettingLocation] = useState(false)

    useEffect(() => {
        p.onChange(currentParameters)
    }, [currentParameters])

    return <Stack sx={p.sx}>
        <Typography variant="h4" textAlign="center" color="secondary">{appContext.i18n.translator('proximityTitle')}</Typography>
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