import { fromData, fromError, initial } from "@/DataLoadState"
import { Resource } from "@/schema"
import { Box, Typography } from "@mui/material"
import axios from "axios"
import { useEffect, useState } from "react"
import LoadingList from "../LoadingList"
import ResourceCard from "./ResourceCard"

const imagePublicBaseUrl = process.env.NEXT_PUBLIC_IMG_URL

const Suggestions = () => {
    const [suggestedResourcesState, setSuggestedResourcesState] = useState(initial<Resource[]>(true))
    useEffect(() => {
        const load = async () => {
            try {
                const resourcesRes = await axios.get('/api/resource/suggestions', { headers: { Authorization: localStorage.getItem('token') }})
                setSuggestedResourcesState(fromData<Resource[]>(resourcesRes.data))
            } catch(e : any) {
                setSuggestedResourcesState(fromError(e, 'Erreur pendant le chargement des données.'))
            }
        }

        load()
    }, [])
    return <Box display="display" flexDirection="column">
        <Typography variant="h2">Suggestions</Typography>
        <LoadingList loadState={suggestedResourcesState} onErrorClosed={() => setSuggestedResourcesState(initial<Resource[]>(false))}
            displayItem={(resource: Resource) => (<ResourceCard resource={resource} onClick={() => {}} />)} />
    </Box>
}

export default Suggestions