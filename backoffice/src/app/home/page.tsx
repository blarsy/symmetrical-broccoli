"use client"
import Feedback from "@/components/Feedback"
import { CircularProgress, Container, Typography } from "@mui/material"
import axios from "axios"
import { useEffect, useState } from "react"

const Home = () => {
    const [name, setName] = useState({ data: '', loading: true, error: {} as { message?: string, detail?: string}})
    useEffect(() => {
        const load = async() => {
            try {
                const res = await axios.get(`/api/user/${localStorage.getItem('token')}`)
                setName({ data: res.data.account.Nom, error: {}, loading: false })
            } catch(e: any) {
                setName({ data: '', loading: false, error: { message: 'Echec du chargement', detail: e.toString() }})
            }
        }
        load()
    }, [])
    return <Container sx={{ height: '100vh' }}>
        <Typography variant="h1">Tableau de bord</Typography>
        { name.loading && <CircularProgress /> }
        { name.data && <Typography variant="body1">Bienvenue {name.data}</Typography> }
        { name.error.message && <Feedback message={name.error.message!} detail={name.error.detail} severity="error"
            onClose={() => setName({data: '', loading: false, error: {}})}/>}
    </Container>
}

export default Home