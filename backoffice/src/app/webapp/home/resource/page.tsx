"use client"
import ClientLayout from "@/components/ClientLayout"
import LoggedInLayout from "@/components/LoggedInLayout"
import MyResources from "@/components/resource/MyRessources"

const ResourcesPage = () => <ClientLayout>
    <LoggedInLayout title="Mes ressources">
        <MyResources />
    </LoggedInLayout>
</ClientLayout>

export default ResourcesPage