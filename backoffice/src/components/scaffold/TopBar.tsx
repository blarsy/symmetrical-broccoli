import { Badge, Box, Button, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, SvgIconTypeMap, Switch } from "@mui/material"
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
import TokensIcon from '@mui/icons-material/Toll'
import useAccountFunctions from "@/lib/useAccountFunctions"
import { ChatContext } from "./ChatContextProvider"
import { UiContext, UiDispatchContext, UiReducerActionType } from "./UiContextProvider"
import { OverridableComponent } from "@mui/material/OverridableComponent"
import MenuIcon from '@mui/icons-material/Menu'
import MiniLogo from '@/app/img/minilogo.svg'
import { useRouter } from "next/navigation"
import { PriceTag } from "../misc"
import { primaryColor } from "@/utils"

interface LinkMenuProps {
    url: string
    text: string
    Icon?: OverridableComponent<SvgIconTypeMap<{}, "svg">>
    badgeContent?: number
    testID?: string
}

const LinkMenu = (p: LinkMenuProps) => {
    if(p.badgeContent) {
        return <Link data-testid={p.testID} href={{ pathname: p.url }}>
            <Badge color="secondary" badgeContent={p.badgeContent}>
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                    { p.Icon && <Box sx={{ minWidth: '36px' }}>
                        <p.Icon fontSize="small" />
                    </Box> }
                    {p.text}
                </Box>
            </Badge>
        </Link>
    } else {
        return <Link data-testid={p.testID} href={{ pathname: p.url }}>
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                { p.Icon && <Box sx={{ minWidth: '36px' }}>
                    <p.Icon fontSize="small" />
                </Box> }
                {p.text}
            </Box>
        </Link>
    }
} 

interface Props {
    version: string
}


const TopBar = ({ version }: Props) => {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    const chatContext = useContext(ChatContext)
    const uiDispatcher = useContext(UiDispatchContext)
    const [connecting, setConnecting] = useState(false)
    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null)
    const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(null)
    const { disconnect } = useAccountFunctions(version)
    const router = useRouter()

    const linksInfo = [
        { url: `/webapp/${uiContext.version}`, textI18n: 'searchButtonCaption', needsLogin: false , testID: 'SearchMenuLink'},
        { url: `/webapp/${uiContext.version}/resources`, textI18n: 'resourcesButtonCaption', needsLogin: true , testID: 'ResourcesMenuLink' },
        { url: `/webapp/${uiContext.version}/bids`, textI18n: 'bidsButtonCaption', needsLogin: true , testID: 'BidsMenuLink' },
        { url: `/webapp/${uiContext.version}/chat`, textI18n: 'chatButtonCaption', badgeContent: chatContext.unreadConversations.length, needsLogin: true, testID: 'ChatMenuLink' },
        { url: `/webapp/${uiContext.version}/notifications`, textI18n: 'notificationsButtonCaption', badgeContent: appContext.unreadNotifications.length, needsLogin: true, testID: 'NotificationsMenuLink' },
    ]

    const makeButtonsMenu = () => {
        let actualLinks = linksInfo
        if(!appContext.account) {
            actualLinks = linksInfo.filter(l => l.needsLogin === false)
        }

        return actualLinks.map((info, idx) => {
            if(info.badgeContent) {
                return <Button key={idx}>
                    <Badge color="secondary" badgeContent={info.badgeContent}>
                        <Link data-testid={info.testID} href={{ pathname: info.url }}>{uiContext.i18n.translator(info.textI18n)}</Link>
                    </Badge>
                </Button>
            } else {
                return <Button key={idx}>
                    <Link data-testid={info.testID} href={{ pathname: info.url }}>{uiContext.i18n.translator(info.textI18n)}</Link>
                </Button>
            }
        })
    }

    const makeItemsMenu = () => {
        let actualLinks = linksInfo
        if(!appContext.account) {
            actualLinks = linksInfo.filter(l => l.needsLogin === false)
        }

        return actualLinks.map((info, idx) => {
            return <MenuItem key={idx} onClick={() => {
                setMenuAnchorEl(null)
            }}>
                <LinkMenu testID={info.testID} text={uiContext.i18n.translator(info.textI18n)}
                    url={ info.url } badgeContent={info.badgeContent} />
            </MenuItem>
        })
    }

    return <Stack direction="row" justifyContent="space-between">
        <Stack sx={theme => ({ 
            [theme.breakpoints.down('sm')]: {
                display: 'none'
            }
         })} direction="row">
            <Link href="/" style={{ margin: '6px 8px', width: '3rem', height: '3rem' }}>
                <MiniLogo width="100%" height="100%" fill={primaryColor}/>
            </Link>
            {makeButtonsMenu()}
        </Stack>
        <IconButton color="primary" sx={theme => ({
                [theme.breakpoints.up('sm')]: {
                    display: 'none'
                }
            })} onClick={e => {
            setMenuAnchorEl(e.currentTarget)
        }}>
            <MenuIcon />
        </IconButton>
        <Menu
            id="menu"
            anchorEl={menuAnchorEl}
            open={!!menuAnchorEl}
            anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
            disableScrollLock
            onClose={() => setMenuAnchorEl(null)}>
            {makeItemsMenu()}
        </Menu>
        <Stack direction="row" sx={theme => ({
            gap: '2rem',
            [theme.breakpoints.down('md')]: {
                gap: '0.5rem'
            }
        })}>
            { appContext.account &&  <Link style={{ display: 'inline-flex' }} href={`/webapp/${version}/profile/tokens`}>
                <PriceTag testID="TokenCounter" value={appContext.account.amountOfTokens} big/>
            </Link> }
            <Stack direction="row" alignItems="center">
                <DarkModeIcon color="primary" />
                <Switch value={uiContext.lightMode} color="primary" onChange={e => {
                    localStorage.setItem('lightMode', uiContext.lightMode ? '': 'Y')
                    uiDispatcher({ type: UiReducerActionType.SwitchLightMode, payload: undefined })
                }}/>
                <LightModeIcon color="primary" /> 
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
                <LinkMenu text={appContext.account?.name || ''} Icon={ConnectedAccount}
                    url={ `/webapp/${version}/profile`} />
            </MenuItem>
            <MenuItem onClick={() => {
                setUserMenuAnchorEl(null)
            }}>
                <LinkMenu text={uiContext.i18n.translator('preferencesMenuCaption')} Icon={EditNotifications}
                    url={`/webapp/${version}/profile/prefs`} />
            </MenuItem>
            <MenuItem onClick={() => {
                setUserMenuAnchorEl(null)
            }}>
                <LinkMenu text={uiContext.i18n.translator('tokensMenuCaption')} Icon={TokensIcon}
                    url={`/webapp/${version}/profile/tokens`} />
            </MenuItem>
            <MenuItem onClick={() => {
                disconnect()
                setUserMenuAnchorEl(null)
                router.push(`/webapp/${uiContext.version}`)
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