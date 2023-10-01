"use client"
import Dashboard from "@/components/resource/Dashboard"
import LoggedInLayout from "@/components/LoggedInLayout"
import ClientWrapper from "@/components/ClientWrapper"

const Home = () => {
    return <ClientWrapper>
            <LoggedInLayout title="Tableau de bord">
                <Dashboard />
            </LoggedInLayout>
        </ClientWrapper> 
}

export default Home