import { Typography, Container, Box, CircularProgress } from "@mui/material"
import { AppContext } from "./AppContextProvider"
import { Fragment, useContext, useEffect, useState } from "react"
import axios from "axios"
import { fromData, fromError, initial } from "@/app/DataLoadState"
import { useRouter } from "next/navigation"

interface Props {
    title?: string,
    children: JSX.Element | '' | undefined
}

const LoggedInLayout = ({ title, children }: Props) => {
    const appContext = useContext(AppContext)
    const router = useRouter()
    const [account, setAccount] = useState(initial())
    useEffect(() => {
        const load = async () => {
            if(!localStorage.getItem('token')){
                router.push('/')
                return
            }
            if(localStorage.getItem('token') && !appContext.data.account.name) {
                try {
                    const res = await axios.get(`/api/user/${localStorage.getItem('token')}`)
                    appContext.loggedIn(res.data.account)
                    setAccount(fromData(res.data.account))
                } catch (e: any) {
                    setAccount(fromError(e, 'Echec lors du chargement du compte.'))
                }

            }
        }
        load()
    }, [])

    let content: JSX.Element

    if(account.loading) {
        content = <Box display="flex" flexDirection="column" alignItems="center">
            <CircularProgress />
        </Box>
    } else {
        content = <Fragment>
            <Box height="1.5rem" display="flex" justifyContent="space-between">
                <Typography variant="body2">Bonjour {appContext.data.account.name}</Typography>
                <Typography variant="overline">Balance: {appContext.data.account.balance}€</Typography>
            </Box>
            { title && <Typography variant="h1">{ title }</Typography> }
            { children }
        </Fragment>
    }

    return <Container sx={{ height: '100vh' }}>
        {content}
    </Container>
}

export default LoggedInLayout