import { IconButton, Stack, Typography } from "@mui/material"
import { useContext, useState } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { Location } from '@/lib/schema'
import NoLocation from "../search/NoCocation"
import SetLocationDialog from "../search/SetLocationDialog"
import DisplayLocation from "./DisplayLocation"
import Edit from "@mui/icons-material/Edit"
import Delete from "@mui/icons-material/Delete"
import { FieldTitle } from "../misc"

interface Props {
    value: Location | null
    onChange: (newLocation: Location | null) => void
}

const EditAddress = (p: Props) => {
    const appContext = useContext(AppContext)
    const [settingAddress, setSettingAddress] = useState(false)
    const [currentAddress, setCurrentAddress] = useState(p.value)

    return <Stack alignItems="center" padding="5px">
        <SetLocationDialog value={currentAddress} onClose={() => setSettingAddress(false)} visible={!!settingAddress} 
            onLocationSet={newLocation => {
                p.onChange(newLocation)
                setCurrentAddress(newLocation)
            }}/>
        <FieldTitle title={appContext.i18n.translator('addressEditTitle')} sx={{ alignSelf: 'flex-start'}} />
        { currentAddress ?
            <Stack height="20rem" minWidth="20rem">
                <Stack direction="row" alignItems="center">
                    <Typography color="secondary">{currentAddress.address}</Typography>
                    <Stack direction="row" gap="3px">
                        <IconButton onClick={() => setSettingAddress(true)}><Edit/></IconButton>
                        <IconButton onClick={() => {
                            setCurrentAddress(null)
                            p.onChange(null)
                        }}><Delete/></IconButton>
                    </Stack>
                </Stack>
                <DisplayLocation value={currentAddress} />
            </Stack>
        :
            <NoLocation onLocationSetRequested={() => setSettingAddress(true)}/>
        }
    </Stack>
}

export default EditAddress