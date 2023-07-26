"use client"
import { fromData, fromError, initial } from "@/DataLoadState"
import AppContextProvider from "@/components/AppContextProvider"
import ClientWrapper from "@/components/ClientWrapper"
import Feedback from "@/components/Feedback"
import LoggedInLayout from "@/components/LoggedInLayout"
import EditResource from "@/components/resource/EditResource"
import { Resource } from "@/schema"
import { CircularProgress } from "@mui/material"
import axios from "axios"
import { useEffect, useState } from "react"
import EditIcon from '@mui/icons-material/Edit'

const ResourcePage = ({ params }: { params: { id: string } }) => {
    const [resource, setResource] = useState(initial<Resource>())
    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`/api/resource/${params.id}`, { headers: {
                    Authorization: localStorage.getItem('token') as string
                }})
                // workaround the fact that res.data.image returns as a string, while it obviously is JSON
                res.data.images = JSON.parse(res.data.images)
                setResource(fromData(res.data))
            } catch (e: any) {
                setResource(fromError(e, 'Erreur au chargement de la ressource.'))
            }
        }
        load()
    }, [])
    let content: JSX.Element
    if(resource.loading) content = <CircularProgress />
    else if(resource.error) {
        content = <Feedback severity="error" message={resource.error.message!}
            detail={resource.error.detail} />
    } else {
        content = <EditResource buttonIcon={<EditIcon />} buttonName="Modifier" 
            data={resource.data!}
            onSubmit={async (values: any) => {
                return await axios.post(`/api/resource/${params.id}`, values, 
                    { headers: { Authorization: localStorage.getItem('token') }})
            }} onImageSelected={async file => {
                const res = await axios.post(`/api/resource/${params.id}/image`, { files: [ file.blob ] } , { headers: {
                    Authorization: localStorage.getItem('token') as string,
                    "Content-Type": "multipart/form-data"
                }})
                setResource(fromData(res.data))
            }} onRequestImageDelete={async image => {
                const res = await axios.patch(`/api/resource/${params.id}/image`, { path: image.path }, { headers: {
                    Authorization: localStorage.getItem('token') as string
                }})
                setResource(fromData(res.data))
            }}/>
    }

    return <AppContextProvider>
        <ClientWrapper>
            <LoggedInLayout title="Modifier une ressource">
                { content }
            </LoggedInLayout>
        </ClientWrapper>
    </AppContextProvider>

}

export default ResourcePage