"use client"
import AppContextProvider from "@/components/AppContextProvider"
import LoggedInLayout from "@/components/LoggedInLayout"
import EditResource from "@/components/resource/EditResource"

const Create = () => {
    return <AppContextProvider>
        <LoggedInLayout title="Créer ressource">
            <EditResource />
        </LoggedInLayout>
    </AppContextProvider>
}

export default Create