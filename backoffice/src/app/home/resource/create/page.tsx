"use client"
import AppContextProvider from "@/components/AppContextProvider"
import LoggedInLayout from "@/components/LoggedInLayout"
import { Typography } from "@mui/material"

const Create = () => {
    return <AppContextProvider>
        <LoggedInLayout title="Créer ressource">
            <Typography>Créer</Typography>
        </LoggedInLayout>
    </AppContextProvider>
}

export default Create