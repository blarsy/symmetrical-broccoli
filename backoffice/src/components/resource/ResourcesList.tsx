import { fromData, fromError, initial } from "@/app/DataLoadState"
import { Card, Typography } from "@mui/material"
import axios from "axios"
import { useEffect, useState } from "react"
import LoadingList from "../LoadingList"
import { Resource } from "@/schema"

const ResourcesList = () => {
    const [resources, setResources] = useState(initial<Resource[]>())
    useEffect(() => {
        const load = async () => {
            try {
                const res = await axios.get(`/api/resource`, { headers: { Authorization: localStorage.getItem('token') }})
                setResources(fromData<Resource[]>(res.data))
            } catch(e: any) {
                setResources(fromError(e, 'Echec lors du chargement des ressources.'))
            }
        }
        load()
    }, [])

    return <LoadingList loadState={resources} onErrorClosed={() => setResources(initial<Resource[]>())}
        displayItem={(item: Resource) => <Card key={item.id} sx={{ display: 'flex', flexDirection: 'row', padding: '0.5rem' }}>
            <Typography variant="body1">{item.title}</Typography>
        </Card>} />
}

export default ResourcesList