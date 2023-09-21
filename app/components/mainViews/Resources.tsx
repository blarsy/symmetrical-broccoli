import React, { useContext, useEffect, useState } from "react"
import AppendableList from "../AppendableList"
import DataLoadState, { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { Resource } from "@/lib/schema"
import { AppContext } from "../AppContextProvider"
import { Appbar, IconButton, List, Text } from "react-native-paper"
import { getResources } from "@/lib/api"
import { t } from "@/i18n"
import { Image, View } from "react-native"
import { imgUrl } from "@/lib/settings"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { lightPrimaryColor } from "../layout/constants"
import EditResource from "../form/EditResource"

const StackNav = createNativeStackNavigator()

interface MyResourcesProps {
    state: DataLoadState<Resource[]>
    onAddRequested: () => void,
    onEditRequested: (res: Resource) => void,
    onViewRequested: (res: Resource) => void
}

const getViewTitleI18n = (routeName: string) => {
    switch(routeName) {
        case 'newResource':
            return 'newResource_viewTitle'
        case 'viewResource':
            return 'viewResource_viewTitle'
        case 'editResource':
            return 'editResource_viewTitle'
        default:
            return ''
    }
}

const MyResources = ({ state, onAddRequested, onEditRequested, onViewRequested }: MyResourcesProps) => {
    const getResourceImage = (res: Resource, size: number) => {
        if(res.images && res.images.length > 0) {
            const imgData = res.images[0]
            return <Image source={{ uri: `${imgUrl}${imgData.path}` }} alt={imgData.title} style={{ width: size, height: size }} />
        }
        return <Image source={require('@/assets/img/placeholder.png')} style={{ width: size, height: size }} />
    }
     
    return <AppendableList state={state} dataFromState={state => state.data!}
        onAddRequested={onAddRequested} 
        displayItem={(item, idx) => <List.Item onPress={() => onViewRequested(item)} key={idx} title={item.title} 
            description={item.description} style={{ margin: 0, padding: 0 }}
            left={() => getResourceImage(item, 70)}
            right={() => <IconButton mode="outlined" icon="pencil" onPress={e => {
                e.stopPropagation()
                onEditRequested(item)
            }} />}
        />} />
}

const Resources = () => {
    const [resources, setResources] = useState(initial<Resource[]>(true))
    const appContext = useContext(AppContext)

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
        loadResources()
    }, [])

    return <StackNav.Navigator screenOptions={{ header: props => props.route.name != 'resourcesMain' && <Appbar.Header style={{ backgroundColor: lightPrimaryColor }}>
            <Appbar.BackAction onPress={() => props.navigation.goBack()} />
            <Appbar.Content titleStyle={{ fontSize: 20, fontFamily: 'DK-magical-brush', textTransform: 'uppercase' }} title={t(getViewTitleI18n(props.route.name))} />
        </Appbar.Header> }}>
        <StackNav.Screen name="resourcesMain" key="resourcesMain"
            component={(({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => 
                <MyResources state={resources} 
                    onAddRequested={() => navigation.navigate('newResource')} 
                    onEditRequested={(resource: Resource) => navigation.navigate('editResource', { resource })}
                    onViewRequested={(resource: Resource) => navigation.navigate('viewResource', { resource })} /> )} />
        <StackNav.Screen name="newResource" key="newResource"
            component={(({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => <EditResource onChange={() => {
                navigation.goBack()
                loadResources() 
            }} /> )} />
        <StackNav.Screen name="viewResource" key="viewResource"
            component={(({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => <Text>{route.name}</Text> )} />
        <StackNav.Screen name="editResource" key="editResource"
            component={(({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => <EditResource resource={route.params.resource} onChange={() => {
                navigation.goBack()
                loadResources() 
            }} /> )} />
    </StackNav.Navigator>
}

export default Resources