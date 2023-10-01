"use client"
import Dashboard from "@/components/resource/Dashboard"
import LoggedInLayout from "@/components/LoggedInLayout"

const Home = () => <LoggedInLayout title="Tableau de bord">
    <Dashboard />
</LoggedInLayout>

export default Home