import { IconButton, Stack, Typography } from "@mui/material"
import { useContext, useState } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { Location } from '@/lib/schema'
import NoLocation from "../search/NoCocation"
import SetLocationDialog from "../search/SetLocationDialog"
import DisplayLocation from "./DisplayLocation"
import Edit from "@mui/icons-material/Edit"
import Delete from "@mui/icons-material/Delete"

interface Props {
    value: Location | null
    onChange: (newLocation: Location | null) => void
}

const EditAddress = (p: Props) => {
    const [settingAddress, setSettingAddress] = useState(false)
    const [currentAddress, setCurrentAddress] = useState(p.value)

    return <>
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
    </>
}

export default EditAddress