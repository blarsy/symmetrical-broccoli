import { Stack } from "@mui/material"
import { useState } from "react"
import { Location } from '@/lib/schema'
import NoLocation from "../search/NoCocation"
import SetLocationDialog from "../search/SetLocationDialog"
import DisplayLocation from "./DisplayLocation"

interface Props {
    value: Location | null
    onChange: (newLocation: Location | null) => void
}

const EditAddress = (p: Props) => {
    const [settingAddress, setSettingAddress] = useState(false)
    const [currentAddress, setCurrentAddress] = useState(p.value)

    return <Stack alignItems="center">
        <SetLocationDialog value={currentAddress} onClose={() => setSettingAddress(false)} visible={!!settingAddress} 
            onLocationSet={newLocation => {
                p.onChange(newLocation)
                setCurrentAddress(newLocation)
            }}/>
        { currentAddress ?
            <DisplayLocation value={currentAddress} editMode 
                onEditRequested={() => setSettingAddress(true)}
                onDeleteRequested={() => {
                    setCurrentAddress(null)
                    p.onChange(null)
                }} />
        :
            <NoLocation onLocationSetRequested={() => setSettingAddress(true)}/>
        }
    </ Stack>
}

export default EditAddress