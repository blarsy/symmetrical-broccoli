import { fromData, fromError, initial } from "@/app/DataLoadState"
import { Card, Typography } from "@mui/material"
import axios from "axios"
import { useEffect, useState } from "react"
import LoadingList from "../LoadingList"
import { Resource } from "@/schema"

interface Props {
    onEditRequested: (res: Resource) => void
}

const ResourcesList = ({ onEditRequested }: Props) => {
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

    return <LoadingList<Resource> loadState={resources} onErrorClosed={() => setResources(initial<Resource[]>())}
        displayItem={(item: Resource) => <Card onClick={() => onEditRequested(item)} key={item.id}
            sx={{ display: 'flex', flexDirection: 'row', padding: '0.5rem', cursor: 'pointer' }}>
            <Typography variant="body1">{item.title}</Typography>
        </Card>} />
}

export default ResourcesList