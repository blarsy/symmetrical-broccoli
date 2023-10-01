"use client"
import ClientWrapper from "@/components/ClientWrapper"
import LoggedInLayout from "@/components/LoggedInLayout"
import MyResources from "@/components/resource/MyRessources"

const ResourcesPage = () => <ClientWrapper>
        <LoggedInLayout title="Mes ressources">
            <MyResources />
        </LoggedInLayout>
    </ClientWrapper>

export default ResourcesPage