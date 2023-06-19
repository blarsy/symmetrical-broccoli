"use client"
import { fromData, fromError, initial } from "@/app/DataLoadState"
import AppContextProvider from "@/components/AppContextProvider"
import ClientWrapper from "@/components/ClientWrapper"
import Feedback from "@/components/Feedback"
import LoggedInLayout from "@/components/LoggedInLayout"
import EditResourceBasic from "@/components/resource/EditResourceBasic"
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
        content = <EditResourceBasic buttonIcon={<EditIcon />} buttonName="Modifier" 
            data={resource.data!} onSuccess={() => {}} 
            onSubmit={async values => {
                return await axios.post(`/api/resource/${params.id}`, values, 
                    { headers: { Authorization: localStorage.getItem('token') }})
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