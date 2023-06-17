"use client"
import { ResourceStatus } from "@/schema"
import AppContextProvider from "@/components/AppContextProvider"
import ClientWrapper from "@/components/ClientWrapper"
import LoggedInLayout from "@/components/LoggedInLayout"
import EditResource from "@/components/resource/EditResource"

const Create = () => {
    return <AppContextProvider>
        <ClientWrapper>
            <LoggedInLayout title="Créer ressource">
                <EditResource data={{ id: '', title: '', description: '', 
                status: ResourceStatus.active, 
                expiration: new Date(Date.now().valueOf() + 2 * 24 * 60 * 60 * 1000),
                images: [] }} onSuccess={(resource) => {}}/>
            </LoggedInLayout>
        </ClientWrapper>
    </AppContextProvider>
}

export default Create