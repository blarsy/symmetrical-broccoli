import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material"
import LocationSelector from "../form/LocationSelector"
import { useContext, useState } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { Location } from '@/lib/schema'

interface Props {
    visible: boolean
    onClose: () => void
    value: Location | null
    onLocationSet: (location: Location) => void
}

const SetLocationDialog = (p: Props) => {
    const appContext = useContext(AppContext)
    const [currentLocation, setCurrentLocation] = useState<Location | null>(p.value)

    return <Dialog sx={{ width: '100vw' }} fullWidth maxWidth="xl" open={p.visible} onClose={p.onClose}>
        <DialogTitle>{appContext.i18n.translator('setLocationDialogTitle')}</DialogTitle>
        <DialogContent sx={{ width: '100%', height: '100vh' }} >
            <LocationSelector value={p.value} onLocationSet={loc => setCurrentLocation(loc)} />
        </DialogContent>
        <DialogActions>
            <Button onClick={ () => p.onClose() }>{appContext.i18n.translator('cancelButton')}</Button>
            <Button disabled={!currentLocation} onClick={ () => {
                p.onLocationSet(currentLocation!)
                p.onClose()
            }}>{appContext.i18n.translator('okButton')}</Button>
        </DialogActions>
    </Dialog>
}

export default SetLocationDialog