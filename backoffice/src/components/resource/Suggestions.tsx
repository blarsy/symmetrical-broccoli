import { fromData, fromError, initial } from "@/DataLoadState"
import { Resource } from "@/schema"
import { Box, Tooltip, Typography } from "@mui/material"
import axios from "axios"
import { useEffect, useState } from "react"
import LoadingList from "../LoadingList"
import Image from "next/image"

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
            displayItem={(resource: Resource) => (<Box display="flex" flexDirection="row" gap="1rem" alignItems="center">
                { resource.images && resource.images.length > 0 ? 
                    <Image width="100" height="100" src={`${imagePublicBaseUrl}/${resource.images[0].path}`} alt={resource.title} /> :
                    <Image width="100" height="100" src="/placeholder.png" alt="pas d'image" />
                }
                <Tooltip title={resource.description}><Typography variant="body1">{resource.title}</Typography></Tooltip>
            </Box>)} />
    </Box>
}

export default Suggestions