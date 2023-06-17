import { Typography, Container, Box, CircularProgress, IconButton, Link } from "@mui/material"
import { AppContext } from "./AppContextProvider"
import { Fragment, useContext, useEffect, useState } from "react"
import axios from "axios"
import { fromData, fromError, initial } from "@/app/DataLoadState"
import { useRouter } from "next/navigation"
import Feedback from "./Feedback"
import HomeIcon from '@mui/icons-material/Home'
import LogoutIcon from '@mui/icons-material/Logout'
import NextLink from "next/link"
import { Account } from "@/schema"

interface Props {
    title?: string,
    children: JSX.Element | '' | undefined
}

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
        content = <Fragment>
            <Box height="1.5rem" display="flex" justifyContent="space-between">
                <Typography variant="body2">Bonjour {appContext.data.account.name}</Typography>
                <Box display="flex" flexDirection="row" gap="0.5rem">
                    <IconButton onClick={() => {
                        localStorage.removeItem('token')
                        router.push('/')
                    }}><LogoutIcon/></IconButton>
                    <Link href="/home" component={NextLink}><HomeIcon/></Link>
                </Box>
                <Typography variant="overline">Balance: {appContext.data.account.balance}€</Typography>
            </Box>
            { title && <Typography variant="h1" textAlign="center">{ title }</Typography> }
            { children }
        </Fragment>
    }

    return <Container sx={{ height: '100vh' }}>
        {content}
    </Container>
}

export default LoggedInLayout