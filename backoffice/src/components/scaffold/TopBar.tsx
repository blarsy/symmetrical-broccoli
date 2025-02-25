import { Button, IconButton } from "@mui/material"
import { Stack } from "@mui/system"
import Link from "next/link"
import { useContext, useState } from "react"
import ConnectDialog from "../user/ConnectDialog"
import { AppContext } from "./AppContextProvider"
import Account from '@mui/icons-material/AccountCircle'
import ConnectedAccount from '@mui/icons-material/ManageAccounts'

interface Props {
    version: string
}

const TopBar = ({ version }: Props) => {
    const appContext = useContext(AppContext)
    const [connecting, setConnecting] = useState(false)

    return <Stack direction="row" justifyContent="space-between">
        <Stack direction="row">
            <Button LinkComponent={Link} href="/webapp/">{appContext.i18n.translator('searchButtonCaption')}</Button>
        </Stack>
        <IconButton onClick={() => {
            if(appContext.account) {
                //display connected menu
            } else {
                setConnecting(true)
            }
        }}>
            { appContext.account ? <ConnectedAccount/>  : <Account /> }
        </IconButton>
        <ConnectDialog visible={connecting} onClose={ () => setConnecting(false) } version={version}/>
    </Stack>
}

export default TopBar