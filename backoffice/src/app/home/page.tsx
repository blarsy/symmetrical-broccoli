"use client"
import Dashboard from "@/components/resource/Dashboard"
import LoggedInLayout from "@/components/LoggedInLayout"
import AppContextProvider from "@/components/AppContextProvider"

const Home = () => {

    return <AppContextProvider>
        <LoggedInLayout title="Tableau de bord">
            <Dashboard />
        </LoggedInLayout> 
    </AppContextProvider>

}

export default Home