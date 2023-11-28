"use client"
import LoggedInLayout from "@/components/LoggedInLayout"
import EditResource from "@/components/resource/EditResource"
import { Box } from "@mui/material"
import Feedback from "@/components/Feedback"
import { useState } from "react"
import { fromError, initial } from "@/DataLoadState"
import axios from "axios"
import { useRouter } from "next/navigation"
import ClientLayout from "@/components/ClientLayout"

const Create = () => {
    const [basicFeedback, setBasicFeedback] = useState(initial<null>())
    const router = useRouter()
    return <ClientLayout>
        <LoggedInLayout title="Créer une ressource">
            <Box>
                <EditResource data={{ id: 0, title: '', description: '', 
                    expiration: new Date(Date.now().valueOf() + 2 * 24 * 60 * 60 * 1000),
                    images: [], categories: [], isProduct: false, isService: false,
                    canBeDelivered: false, canBeTakenAway: false, canBeExchanged: true, canBeGifted: false }} onSubmit={async (values, images) => {
                        try {
                            const res = await axios.post('/api/resource', { 
                                title: values.title, description: values.description, 
                                expiration: values.expiration ? values.expiration.toDate(): undefined,
                                categories: values.categories },
                                { headers: { Authorization: localStorage.getItem('token') }})
                            if(images.length > 0){
                                await axios.postForm(`/api/resource/${res.data.id}/image`, { files: images.map(img => img.blob) } , { headers: {
                                    Authorization: localStorage.getItem('token') as string,
                                    "Content-Type": "multipart/form-data"
                                }})
                            }
                            router.push(`/webapp/home/resource/${res.data.id}`)
                            return res
                        } catch (e: any) {
                            setBasicFeedback(fromError(e, 'Erreur pendant la sauvegarde'))
                        }
                    }} />
                { basicFeedback.error && <Feedback message={basicFeedback.error.message!}
                    detail={basicFeedback.error.detail} severity="error"/>}
            </Box>
        </LoggedInLayout>
    </ClientLayout>
}

export default Create