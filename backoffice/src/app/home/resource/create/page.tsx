"use client"
import { Resource } from "@/schema"
import AppContextProvider from "@/components/AppContextProvider"
import ClientWrapper from "@/components/ClientWrapper"
import LoggedInLayout from "@/components/LoggedInLayout"
import EditResourceBasic from "@/components/resource/EditResourceBasic"
import { Box } from "@mui/material"
import Feedback from "@/components/Feedback"
import { useState } from "react"
import { fromData, fromError, initial } from "@/app/DataLoadState"
import axios from "axios"

const Create = () => {
    const [basicFeedback, setBasicFeedback] = useState(initial<null>())
    return <AppContextProvider>
        <ClientWrapper>
            <LoggedInLayout title="Créer une ressource">
                <Box>
                    <EditResourceBasic data={{ id: '', title: '', description: '', 
                        expiration: new Date(Date.now().valueOf() + 2 * 24 * 60 * 60 * 1000),
                        images: [] }} onSuccess={async (resource: Resource) => {
                            try {
                                await axios.post(`/resource/${resource.id}`, resource)
                                setBasicFeedback(fromData<null>(null))
                            } catch(e: any) {
                                setBasicFeedback(fromError(e, 'Erreur lors de la sauvegarde de la ressource.'))
                            }
                        }} onSubmit={async values => {
                            return await axios.post('/api/resource', { 
                                title: values.title, description: values.description, 
                                expiration: values.expiration ? values.expiration.toDate(): undefined },
                                { headers: { Authorization: localStorage.getItem('token') }})
                        }}/>
                    { basicFeedback.error && <Feedback message={basicFeedback.error.message!}
                        detail={basicFeedback.error.detail} severity="error"/>}
                </Box>
            </LoggedInLayout>
        </ClientWrapper>
    </AppContextProvider>
}

export default Create