import React, { useContext, useEffect, useState } from "react"
import AppendableList from "../AppendableList"
import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { Resource } from "@/lib/schema"
import { AppContext } from "../AppContextProvider"
import { IconButton, List, useTheme } from "react-native-paper"
import { deleteResource, getResources } from "@/lib/api"
import { t } from "@/i18n"
import { View } from "react-native"
import { RouteProps } from "@/lib/utils"
import { EditResourceContext } from "../EditResourceContextProvider"
import MainResourceImage from "../MainResourceImage"
import ConfirmDialog from "../ConfirmDialog"
import ResponsiveListItem from "../ResponsiveListItem"

const Resources = ({ route, navigation }: RouteProps) => {
    const [resources, setResources] = useState(initial<Resource[]>(true))
    const [deletingResource, setDeletingResource] = useState(0)
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

    const theme = useTheme()

    return <>
        <AppendableList state={resources} dataFromState={state => state.data!}
            onAddRequested={() => navigation.navigate('newResource')} 
            displayItem={(resource, idx) => <ResponsiveListItem onPress={() => navigation.navigate('viewResource', { resource })} key={idx} title={resource.title} 
                description={resource.description} style={{ margin: 0, padding: 0 }}
                left={() => <MainResourceImage resource={resource} />}
                right={() => <View style={{ flexDirection: 'row' }}>
                    <IconButton style={{ alignSelf: 'center' }} mode="outlined" size={34} icon="pencil" onPress={e => {
                        e.stopPropagation()
                        editResourceContext.actions.setResource(resource)
                        navigation.navigate('editResource')
                    }} />
                    <IconButton style={{ alignSelf: 'center' }} mode="outlined" iconColor="red" size={34} icon="close" onPress={e => {
                        e.stopPropagation()
                        setDeletingResource(resource.id)
                    }} />
                </View>}
            />}
        />
        <ConfirmDialog title={t('Confirmation_DialogTitle')} question={t('Confirm_Resource_Delete_Question')}
            visible={!!deletingResource} onResponse={async response => {
                if(response) {
                    await deleteResource(appContext.state.token.data!, deletingResource)
                    await loadResources()
                }
                setDeletingResource(0)
            }} />
    </>
}

export default Resources