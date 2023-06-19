"use client"
import Dashboard from "@/components/resource/Dashboard"
import LoggedInLayout from "@/components/LoggedInLayout"
import AppContextProvider from "@/components/AppContextProvider"
import ClientWrapper from "@/components/ClientWrapper"

const Home = () => {
    return <AppContextProvider>
        <ClientWrapper>
            <LoggedInLayout title="Tableau de bord">
                <Dashboard />
            </LoggedInLayout>
        </ClientWrapper> 
    </AppContextProvider>
}

export default Home