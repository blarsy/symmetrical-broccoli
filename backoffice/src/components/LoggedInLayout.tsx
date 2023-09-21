import { Typography, Container, Box, CircularProgress, IconButton, AppBar, Stack, Button } from "@mui/material"
import { AppContext } from "./AppContextProvider"
import { useContext, useEffect, useState } from "react"
import axios from "axios"
import { fromData, fromError, initial } from "@/DataLoadState"
import { useRouter } from "next/navigation"
import Feedback from "./Feedback"
import LogoutIcon from '@mui/icons-material/Logout'
import NextLink from "next/link"
import { Account } from "@/schema"
import Image from 'next/image'

interface Props {
    title?: string,
    children: JSX.Element | '' | undefined
}

const pages = [
    { name: 'Tableau de bord', path: '/home' },
    { name: 'Resources', path: '/home/resource' },
    { name: 'Réseau', path: '/home/network' },
]

const LoggedInLayout = ({ title, children }: Props) => {
    const appContext = useContext(AppContext)
    const router = useRouter()
    const [account, setAccount] = useState(initial<Account>())
    useEffect(() => {
        const load = async () => {
            if(!localStorage.getItem('token')){
                router.push('/')
                return
            }
            if(localStorage.getItem('token') && !appContext.data.account.name) {
                try {
                    const res = await axios.get(`/api/user`, { headers: { Authorization: localStorage.getItem('token') } })
                    appContext.loggedIn(res.data.account)
                    setAccount(fromData<Account>(res.data.account))
                } catch (e: any) {
                    setAccount(fromError(e, 'Echec lors du chargement du compte.'))
                    localStorage.removeItem('token')
                    router.push('/')
                }
            }
        }
        load()
    }, [])

    let content: JSX.Element

    if(account.loading) {
        content = <Box display="flex" flexDirection="column" alignItems="center" padding="2rem">
            <CircularProgress />
        </Box>
    } else if (account.error){
        content = <Feedback message="La connexion a échoué. Vous allez pouvoir vous reconnecter dans quelques instants." 
            detail={account.error.detail} severity="error"/>
    } else {
        content = <>
            <AppBar position="static">
                <Stack direction="row" alignItems="center" justifyContent="space-between" padding="0 1rem">
                    <Image src="/logo.jpeg" alt="logo Tope-là" width={100} height={85}/>
                    <Typography variant="body2">Bonjour {appContext.data.account.name}</Typography>
                    <Box display="flex" flexDirection="row" gap="0.5rem">
                        { pages.map(page => <Button LinkComponent={NextLink} color="secondary" href={page.path} variant="text">{page.name}</Button>) }
                        <IconButton onClick={() => {
                            localStorage.removeItem('token')
                            router.push('/')
                        }}><LogoutIcon/></IconButton>
                    </Box>
                    <Typography variant="overline">Balance: {appContext.data.account.balance}€</Typography>
                </Stack>
            </AppBar>
            { title && <Typography variant="h1" textAlign="center">{ title }</Typography> }
            { children }
        </>
    }

    return <Container sx={{ height: '100vh' }}>
        {content}
    </Container>
}

export default LoggedInLayout