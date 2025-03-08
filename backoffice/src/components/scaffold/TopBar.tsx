import { Button, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Switch, Typography } from "@mui/material"
import { Stack } from "@mui/system"
import Link from "next/link"
import { useContext, useState } from "react"
import ConnectDialog from "../user/ConnectDialog"
import { AppContext, AppDispatchContext, AppReducerActionType } from "./AppContextProvider"
import Account from '@mui/icons-material/AccountCircle'
import ConnectedAccount from '@mui/icons-material/ManageAccounts'
import ManageAccounts from '@mui/icons-material/ManageAccounts'
import EditNotifications from '@mui/icons-material/EditNotifications'
import { useRouter } from "next/navigation"
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LogoutIcon from '@mui/icons-material/Logout'
import useAccountFunctions from "@/lib/useAccountFunctions"

interface Props {
    version: string
}

const TopBar = ({ version }: Props) => {
    const appContext = useContext(AppContext)
    const appDispatcher = useContext(AppDispatchContext)
    const [connecting, setConnecting] = useState(false)
    const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null)
    const router = useRouter()
    const { disconnect } = useAccountFunctions(version)

    return <Stack direction="row" justifyContent="space-between">
        <Stack direction="row">
            <Button LinkComponent={Link} href={`/webapp/${appContext.version}`}>{appContext.i18n.translator('searchButtonCaption')}</Button>
        </Stack>
        <Stack direction="row" gap="2rem">
            <Stack direction="row" alignItems="center">
                <LightModeIcon color="primary" /> 
                <Switch value={appContext.lightMode} color="primary" onChange={e => {
                    localStorage.setItem('lightMode', appContext.lightMode ? '': 'Y')
                    appDispatcher({ type: AppReducerActionType.SwitchLightMode, payload: undefined })
                }}/>
                <DarkModeIcon color="primary" />
            </Stack>
            <IconButton color="primary" onClick={e => {
                if(appContext.account) {
                    setUserMenuAnchorEl(e.currentTarget)
                } else {
                    setConnecting(true)
                }
            }}>
                { appContext.account ? <ConnectedAccount/>  : <Account /> }
            </IconButton>
        </Stack>
        <Menu
            id="user-menu"
            anchorEl={userMenuAnchorEl}
            open={!!userMenuAnchorEl}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
            onClose={() => setUserMenuAnchorEl(null)}>
            <MenuItem onClick={() => {
                setUserMenuAnchorEl(null)
                router.push(`${version}/profile`)
            }}>
                <ListItemIcon>
                    <ManageAccounts fontSize="small" />
                </ListItemIcon>
                <ListItemText>{appContext.account?.name}</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => setUserMenuAnchorEl(null)}>
                <ListItemIcon>
                    <EditNotifications fontSize="small" />
                </ListItemIcon>
                <ListItemText>{appContext.i18n.translator('preferencesMenuCaption')}</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => {
                disconnect()
                setUserMenuAnchorEl(null)
            }}>
                <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{appContext.i18n.translator('logoutMenuCaption')}</ListItemText>
            </MenuItem>
        </Menu>
        <ConnectDialog visible={connecting} onClose={ () => setConnecting(false) } version={version}/>
    </Stack>
}

export default TopBar