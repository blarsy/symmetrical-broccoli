import { fromData, fromError, initial } from "@/app/DataLoadState"
import { Box, Typography } from "@mui/material"
import axios from "axios"
import { useEffect, useState } from "react"
import LoadingList from "../LoadingList"

const ResourcesList = () => {
    const [resources, setResources] = useState(initial())
    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`/api/resource?token=${localStorage.getItem('token')}`)
                setResources(fromData(res.data))
            } catch(e: any) {
                setResources(fromError(e, 'Echec lors du chargement des ressources.'))
            }
        }
        load()
    }, [])

    return <LoadingList loadState={resources} onErrorClosed={() => setResources(initial())}
        displayItem={(item) => <Box key={item.Id} display="flex" flexDirection="row">
            <Typography variant="body1">{item.titre}</Typography>
            <Typography variant="body1">{item.titre}</Typography>
        </Box>} />

}

export default ResourcesList