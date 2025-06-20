import { Badge, Box, Button, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Switch } from "@mui/material"
import { Stack } from "@mui/system"
import Link from "next/link"
import { useContext, useState } from "react"
import ConnectDialog from "../user/ConnectDialog"
import { AppContext } from "./AppContextProvider"
import Account from '@mui/icons-material/AccountCircle'
import ConnectedAccount from '@mui/icons-material/ManageAccounts'
import EditNotifications from '@mui/icons-material/EditNotifications'
import LightModeIcon from '@mui/icons-material/LightMode'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LogoutIcon from '@mui/icons-material/Logout'
import useAccountFunctions from "@/lib/useAccountFunctions"
import { ChatContext } from "./ChatContextProvider"
import { UiContext, UiDispatchContext, UiReducerActionType } from "./UiContextProvider"

interface Props {
    version: string
}

const TopBar = ({ version }: Props) => {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    const chatContext = useContext(ChatContext)
    const uiDispatcher = useContext(UiDispatchContext)
    const [connecting, setConnecting] = useState(false)
    const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null)
    const { disconnect } = useAccountFunctions(version)

    return <Stack direction="row" justifyContent="space-between">
        <Stack direction="row">
            <Button><Link href={{ pathname: `/webapp/${uiContext.version}` }}>{uiContext.i18n.translator('searchButtonCaption')}</Link></Button>
            { appContext.account && [
                <Button key="resources"><Link href={{ pathname: `/webapp/${uiContext.version}/resources` }}>{uiContext.i18n.translator('resourcesButtonCaption')}</Link></Button>,
                <Button key="chat">
                    <Badge color="secondary" badgeContent={chatContext.unreadConversations.length}>
                        <Link href={{ pathname: `/webapp/${uiContext.version}/chat` }}>{uiContext.i18n.translator('chatButtonCaption')}</Link>
                    </Badge>
                </Button>,                
            ]}
        </Stack>
        <Stack direction="row" gap="2rem">
            <Stack direction="row" alignItems="center">
                <LightModeIcon color="primary" /> 
                <Switch value={uiContext.lightMode} color="primary" onChange={e => {
                    localStorage.setItem('lightMode', uiContext.lightMode ? '': 'Y')
                    uiDispatcher({ type: UiReducerActionType.SwitchLightMode, payload: undefined })
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
            disableScrollLock
            onClose={() => setUserMenuAnchorEl(null)}>
            <MenuItem onClick={() => {
                setUserMenuAnchorEl(null)
            }}>
                <Link href={{ pathname: `/webapp/${version}/profile` }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                        <Box sx={{ minWidth: '36px' }}>
                            <ConnectedAccount fontSize="small" />
                        </Box>
                        {appContext.account?.name}
                    </Box>
                </Link>
            </MenuItem>
            <MenuItem onClick={() => {
                setUserMenuAnchorEl(null)
            }}>
                <Link href={{ pathname: `/webapp/${version}/profile/prefs`}}>
                    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                        <Box sx={{ minWidth: '36px' }}>
                            <EditNotifications fontSize="small" />
                        </Box>
                        {uiContext.i18n.translator('preferencesMenuCaption')}
                    </Box>
                </Link>
            </MenuItem>
            <MenuItem onClick={() => {
                disconnect()
                setUserMenuAnchorEl(null)
            }}>
                <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>{uiContext.i18n.translator('logoutMenuCaption')}</ListItemText>
            </MenuItem>
        </Menu>
        <ConnectDialog visible={connecting} onClose={ () => setConnecting(false) } version={version}/>
    </Stack>
}

export default TopBar