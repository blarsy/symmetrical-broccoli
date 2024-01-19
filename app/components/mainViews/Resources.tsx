import React, { useContext, useEffect, useState } from "react"
import AppendableList from "../AppendableList"
import { fromServerGraphResources } from "@/lib/schema"
import { AppContext } from "../AppContextProvider"
import { IconButton } from "react-native-paper"
import { t } from "@/i18n"
import { View } from "react-native"
import { LoadState, RouteProps, aboveMdWidth } from "@/lib/utils"
import { EditResourceContext } from "../EditResourceContextProvider"
import { SmallResourceImage } from "../MainResourceImage"
import ConfirmDialog from "../ConfirmDialog"
import ResponsiveListItem from "../ResponsiveListItem"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { gql, useMutation, useQuery } from "@apollo/client"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import SimpleBackHeader from "../layout/SimpleBackHeader"
import EditResource from "../form/EditResource"
import ViewResource from "../ViewResource"

const RESOURCES = gql`query MyResources {
    myresources {
      nodes {
        id
        expiration
        description
        created
        isProduct
        isService
        title
        canBeTakenAway
        canBeExchanged
        canBeGifted
        canBeDelivered
        accountByAccountId {
          id
          name
          email
        }
        resourcesImagesByResourceId {
          nodes {
            imageByImageId {
              created
              id
              publicId
            }
          }
        }
        resourcesResourceCategoriesByResourceId {
          nodes {
            resourceCategoryCode
          }
        }
      }
    }
  }`

const DELETE_RESOURCE = gql`mutation DeleteResource($resourceId: Int) {
  deleteResource(input: {resourceId: $resourceId}) {
    integer
  }
}`

const ResourcesList = ({ route, navigation }: RouteProps) => {
    const {data, loading, error, refetch} = useQuery(RESOURCES)
    const [deletingResource, setDeletingResource] = useState(0)
    const editResourceContext = useContext(EditResourceContext)
    const [deleteResource] = useMutation(DELETE_RESOURCE)

    const loadResources = () => {
      return refetch()
    }

    useEffect(() => {
        if(route.params && route.params.hasChanged) {
            loadResources()
        }
    }, [route])

    const iconButtonsSize = aboveMdWidth() ? 60 : 40
    
    return <>
        <AppendableList state={{ data, loading, error } as LoadState} dataFromState={state => state.data && fromServerGraphResources(state.data?.myresources?.nodes, editResourceContext.state.categories.data || [])}
            onAddRequested={() => navigation.navigate('newResource')} 
            contentContainerStyle={{ gap: 8, padding: aboveMdWidth() ? 20 : 5 }}
            displayItem={(resource, idx) => <ResponsiveListItem onPress={() => navigation.navigate('viewResource', { resourceid: resource.id })} key={idx} title={resource.title} 
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
                await deleteResource({ variables: {
                  resourceId: deletingResource
                } })
                await loadResources()
                setDeletingResource(0)
              } else {
                setDeletingResource(0)
              }
            }} />
    </>
}

const StackNav = createNativeStackNavigator()

const Resources = ({ route, navigation }: RouteProps) => {
  return <StackNav.Navigator screenOptions={{ contentStyle: { backgroundColor: '#fff' } }}>
      <StackNav.Screen name="resources" component={ResourcesList} options={{ headerShown: false }} />
      <StackNav.Screen name="newResource" key="newResource" options={{ header: SimpleBackHeader }} component={EditResource} initialParams={{isNew: true}}/>
      <StackNav.Screen name="viewResource" key="viewResource" options={{ header: SimpleBackHeader }} component={ViewResource} />
      <StackNav.Screen name="editResource" key="editResource" options={{ header: SimpleBackHeader }} component={EditResource} />
  </StackNav.Navigator>
}

export default Resources