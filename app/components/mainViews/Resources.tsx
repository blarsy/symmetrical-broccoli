import React, { useContext, useEffect, useState } from "react"
import AppendableList from "../AppendableList"
import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { Resource } from "@/lib/schema"
import { AppContext } from "../AppContextProvider"
import { IconButton, List } from "react-native-paper"
import { getResources } from "@/lib/api"
import { t } from "@/i18n"
import { Image } from "react-native"
import { imgUrl } from "@/lib/settings"
import { RouteProps } from "@/lib/utils"
import { EditResourceContext } from "../EditResourceContextProvider"

const Resources = ({ route, navigation }: RouteProps) => {
    const [resources, setResources] = useState(initial<Resource[]>(true))
    const appContext = useContext(AppContext)
    const editResourceContext = useContext(EditResourceContext)

    const loadResources = async () => {
        setResources(beginOperation())
        try {
            const resources = await getResources(appContext.state.token.data!)
            setResources(fromData(resources))
        } catch(e) {
            setResources(fromError(e, t('requestError')))
        }
    }

    useEffect(() => {
        if(route.params && route.params.hasChanged) {
            loadResources()
        }
    }, [route])

    useEffect(() => {
        loadResources()
    }, [])

    const getResourceImage = (res: Resource, size: number) => {
        if(res.images && res.images.length > 0) {
            const imgData = res.images[0]
            return <Image source={{ uri: `${imgUrl}${imgData.path}` }} alt={imgData.title} style={{ width: size, height: size }} />
        }
        return <Image source={require('@/assets/img/placeholder.png')} style={{ width: size, height: size }} />
    }

    return <AppendableList state={resources} dataFromState={state => state.data!}
        onAddRequested={() => navigation.navigate('newResource')} 
        displayItem={(resource, idx) => <List.Item onPress={() => navigation.navigate('viewResource', { resource })} key={idx} title={resource.title} 
            description={resource.description} style={{ margin: 0, padding: 0 }}
            left={() => getResourceImage(resource, 70)}
            right={() => <IconButton mode="outlined" size={40} icon="pencil" onPress={e => {
                e.stopPropagation()
                editResourceContext.actions.setResource(resource)
                navigation.navigate('editResource')
            }} />}
        />} />
}

export default Resources