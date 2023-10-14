"use client"
import Dashboard from "@/components/resource/Dashboard"
import LoggedInLayout from "@/components/LoggedInLayout"
import ClientLayout from "@/components/ClientLayout"

const Home = () => <ClientLayout>
    <LoggedInLayout title="Tableau de bord">
        <Dashboard />
    </LoggedInLayout> 
</ClientLayout>

export default Home