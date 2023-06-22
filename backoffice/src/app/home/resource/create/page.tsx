"use client"
import { Resource } from "@/schema"
import AppContextProvider from "@/components/AppContextProvider"
import ClientWrapper from "@/components/ClientWrapper"
import LoggedInLayout from "@/components/LoggedInLayout"
import EditResourceBasic from "@/components/resource/EditResourceBasic"
import { Box } from "@mui/material"
import Feedback from "@/components/Feedback"
import { useState } from "react"
import { fromError, initial } from "@/app/DataLoadState"
import axios from "axios"

const Create = () => {
    const [basicFeedback, setBasicFeedback] = useState(initial<null>())
    return <AppContextProvider>
        <ClientWrapper>
            <LoggedInLayout title="Créer une ressource">
                <Box>
                    <EditResourceBasic data={{ id: 0, title: '', description: '', 
                        expiration: new Date(Date.now().valueOf() + 2 * 24 * 60 * 60 * 1000),
                        images: [], conditions: [] }} onSubmit={async (values, images) => {
                            try {
                                const res = await axios.post('/api/resource', { 
                                    title: values.title, description: values.description, 
                                    expiration: values.expiration ? values.expiration.toDate(): undefined },
                                    { headers: { Authorization: localStorage.getItem('token') }})
                                await axios.postForm(`/api/resource/${res.data.Id}/image`, { files: images } , { headers: {
                                    Authorization: localStorage.getItem('token') as string,
                                    "Content-Type": "multipart/form-data"
                                }})
                                return res
                            } catch (e: any) {
                                setBasicFeedback(fromError(e, 'Erreur pendant la sauvegarde'))
                            }
                        }}/>
                    { basicFeedback.error && <Feedback message={basicFeedback.error.message!}
                        detail={basicFeedback.error.detail} severity="error"/>}
                </Box>
            </LoggedInLayout>
        </ClientWrapper>
    </AppContextProvider>
}

export default Create