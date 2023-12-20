import React, { useContext, useEffect, useState } from "react"
import AppendableList from "../AppendableList"
import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { Resource } from "@/lib/schema"
import { AppContext } from "../AppContextProvider"
import { IconButton } from "react-native-paper"
import { deleteResource, getResources } from "@/lib/api"
import { t } from "@/i18n"
import { View } from "react-native"
import { RouteProps, aboveMdWidth } from "@/lib/utils"
import { EditResourceContext } from "../EditResourceContextProvider"
import { SmallResourceImage } from "../MainResourceImage"
import ConfirmDialog from "../ConfirmDialog"
import ResponsiveListItem from "../ResponsiveListItem"
import { lightPrimaryColor, primaryColor } from "../layout/constants"

const Resources = ({ route, navigation }: RouteProps) => {
    const [resources, setResources] = useState(initial<Resource[]>(true, []))
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

    const iconButtonsSize = aboveMdWidth() ? 60 : 40

    return <>
        <AppendableList state={resources} dataFromState={state => state.data!}
            onAddRequested={() => navigation.navigate('newResource')} 
            contentContainerStyle={{ gap: 8, padding: aboveMdWidth() ? 20 : 5 }}
            displayItem={(resource, idx) => <ResponsiveListItem onPress={() => navigation.navigate('viewResource', { resource })} key={idx} title={resource.title} 
                titleNumberOfLines={1}
                description={resource.description} style={{ margin: 0, padding: 0, paddingLeft: 6, backgroundColor: lightPrimaryColor, borderRadius: 10 }}
                left={() => <SmallResourceImage resource={resource} />}
                right={() => <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                    <IconButton style={{ alignSelf: 'center', margin: 0 }} size={iconButtonsSize} iconColor="#000" icon="pencil-circle-outline" onPress={e => {
                        e.stopPropagation()
                        editResourceContext.actions.setResource(resource)
                        navigation.navigate('editResource')
                    }} />
                    <IconButton style={{ alignSelf: 'center', margin: 0 }} iconColor={primaryColor} size={iconButtonsSize} icon="close-circle-outline" onPress={e => {
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