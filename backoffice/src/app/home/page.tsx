"use client"
import Feedback from "@/components/Feedback"
import Dashboard from "@/components/resource/Dashboard"
import { CircularProgress } from "@mui/material"
import axios from "axios"
import { useEffect, useState } from "react"
import { fromData, fromError, initial } from "../DataLoadState"
import LoggedInLayout from "@/components/LoggedInLayout"
import AppContextProvider from "@/components/AppContextProvider"

const Home = () => {
    const [account, setAccount] = useState(initial())
    useEffect(() => {
        const load = async() => {
            try {
                const res = await axios.get(`/api/user/${localStorage.getItem('token')}`)
                setAccount(fromData(res.data))
            } catch(e: any) {
                setAccount(fromError(e, 'Echec du chargement.'))
            }
        }
        load()
    }, [])
    return <AppContextProvider>
        <LoggedInLayout title="Tableau de bord">
            { account.loading ? <CircularProgress /> :
                account.data ? <Dashboard /> :
                account.error.message && <Feedback message={account.error.message!} detail={account.error.detail} 
                severity="error" onClose={() => setAccount({data: {}, loading: false, error: {}})}/>
            }
        </LoggedInLayout> 
    </AppContextProvider>

}

export default Home