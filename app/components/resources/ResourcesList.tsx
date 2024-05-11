import { LoadState, RouteProps, aboveMdWidth } from "@/lib/utils"
import { EditResourceContext } from "../EditResourceContextProvider"
import { SmallResourceImage } from "../MainResourceImage"
import ConfirmDialog from "../ConfirmDialog"
import ResponsiveListItem from "../ResponsiveListItem"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { gql, useMutation, useQuery } from "@apollo/client"
import { SearchFilterContext } from "../SearchFilterContextProvider"
import AppendableList, { AddItemButton } from "../AppendableList"
import { fromServerGraphResources } from "@/lib/schema"
import { AppContext } from "../AppContextProvider"
import { Banner, IconButton } from "react-native-paper"
import { t } from "@/i18n"
import { View } from "react-native"
import { useContext, useEffect, useState } from "react"
import React = require("react")

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

const SEND_AGAIN = gql`mutation SendAgain {
  sendActivationAgain(input: {}) {
      integer
  }
}`

interface ResourceListProps {
  route: any
  addRequested: () => void
  viewRequested: (resourceId: number) => void
  editRequested: () => void
}

export const ResourcesList = ({ route, addRequested, viewRequested, editRequested }: ResourceListProps) => {
    const appContext = useContext(AppContext)
    const {data, loading, error, refetch} = useQuery(RESOURCES, { fetchPolicy: 'no-cache' })
    const [deletingResource, setDeletingResource] = useState(0)
    const editResourceContext = useContext(EditResourceContext)
    const searchFilterContext = useContext(SearchFilterContext)
    const [deleteResource] = useMutation(DELETE_RESOURCE)
    const [sendAgain] = useMutation(SEND_AGAIN)
    const [hideBanner, setHideBanner] = useState(false)

    useEffect(() => {
      if(appContext.state.account)
        refetch()

      editResourceContext.actions.setChangeCallback(refetch)
      return () => editResourceContext.actions.removeChangeCallback()
    }, [route])

    const iconButtonsSize = aboveMdWidth() ? 60 : 40
    
    return <>
        <Banner visible={!!appContext.state.account && !appContext.state.account.activated && !hideBanner} style={{ alignSelf: 'stretch' }}
            actions={[ { label: t('send_activation_mail_again_button'), onPress: async () => {
                try {
                    await sendAgain()
                } catch(e) {
                    appContext.actions.notify({ error: e as Error, message: t('error_sending_again') })
                }
            } }, { label: t('hide_button'), onPress: () => {
                setHideBanner(true)  
            }} ]}>
            {t('activate_account', { email: appContext.state.account?.email })}
        </Banner>
        { appContext.state.account ?
          <AppendableList state={{ data, loading, error } as LoadState} dataFromState={state => state.data && fromServerGraphResources(state.data?.myresources?.nodes, editResourceContext.state.categories.data || [])}
              onAddRequested={addRequested} onRefreshRequested={() => {
                refetch()
              }}
              contentContainerStyle={{ gap: 8, padding: aboveMdWidth() ? 20 : 5 }}
              displayItem={(resource, idx) => <ResponsiveListItem onPress={() => viewRequested(resource.id) } key={idx} title={resource.title} 
                  titleNumberOfLines={1}
                  description={resource.description} style={{ margin: 0, padding: 0, paddingLeft: 6, backgroundColor: lightPrimaryColor, borderRadius: 10 }}
                  left={() => <SmallResourceImage resource={resource} />}
                  right={() => <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                      <IconButton style={{ alignSelf: 'center', margin: 0 }} size={iconButtonsSize} iconColor="#000" icon="pencil-circle-outline" onPress={e => {
                          e.stopPropagation()
                          editResourceContext.actions.setResource(resource)
                          editRequested()
                      }} />
                      <IconButton style={{ alignSelf: 'center', margin: 0 }} iconColor={primaryColor} size={iconButtonsSize} icon="close-circle-outline" onPress={e => {
                          e.stopPropagation()
                          setDeletingResource(resource.id)
                      }} />
                  </View>}
              />}
          /> :
          <View style={{ flexDirection: 'row', margin: 10 }}>
            <AddItemButton onAddRequested={addRequested} />
          </View>
        }
        <ConfirmDialog title={t('Confirmation_DialogTitle')} question={t('Confirm_Resource_Delete_Question')}
            visible={!!deletingResource} onResponse={async response => {
              if(response) {
                await deleteResource({ variables: {
                  resourceId: deletingResource
                } })
                await refetch()
                searchFilterContext.actions.requery(editResourceContext.state.categories.data)
                setDeletingResource(0)
              } else {
                setDeletingResource(0)
              }
            }} />
    </>
}

const ResourcesListNavigationComponent = ({ route, navigation }: RouteProps) => {
  return <ResourcesList route={route} 
    addRequested={ () => () => navigation.navigate('newResource') }
    viewRequested={ resourceId => navigation.navigate('viewResource', { resourceId: resourceId })} 
    editRequested={ () => navigation.navigate('editResource') }/>
}

export default ResourcesListNavigationComponent