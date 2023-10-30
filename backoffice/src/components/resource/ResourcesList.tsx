import { fromData, fromError, initial } from "@/DataLoadState"
import axios from "axios"
import { useEffect, useState } from "react"
import LoadingList from "../LoadingList"
import { Resource } from "@/schema"
import ResourceCard from "./ResourceCard"
import ConfirmDialog from "../ConfirmDialog"

interface Props {
    onEditRequested: (res: Resource) => void
}

const ResourcesList = ({ onEditRequested }: Props) => {
    const load = async () => {
        try {
            const res = await axios.get(`/api/resource`, { headers: { Authorization: localStorage.getItem('token') }})
            setResources(fromData<Resource[]>(res.data))
        } catch(e: any) {
            setResources(fromError(e, 'Echec lors du chargement des ressources.'))
        }
    }
    const [resources, setResources] = useState(initial<Resource[]>())
    const [confirmingDelete, setConfirmingDelete] = useState(0)
    useEffect(() => {
        load()
    }, [])

    return <>
    <LoadingList<Resource> loadState={resources} onErrorClosed={() => setResources(initial<Resource[]>())}
        displayItem={(item: Resource) => 
            <ResourceCard resource={item} onClick={() => onEditRequested(item)} onDelete={() => setConfirmingDelete(item.id)} />}
         />
         <ConfirmDialog opened={!!confirmingDelete} onClose={async response => {
            if(response) {
                await axios.delete(`/api/resource/${confirmingDelete}`, { headers: {
                    Authorization: localStorage.getItem('token') as string
                }})
                await load()
            }
            setConfirmingDelete(0)
        }} question="Supprimer cette resource ?" title="Confirmation"/>
    </>
}

export default ResourcesList