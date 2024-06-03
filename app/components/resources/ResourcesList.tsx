import { LoadState, RouteProps, aboveMdWidth } from "@/lib/utils"
import { EditResourceContext } from "./EditResourceContextProvider"
import { SmallResourceImage } from "./MainResourceImage"
import ConfirmDialog from "../ConfirmDialog"
import ResponsiveListItem from "../ResponsiveListItem"
import { deletedGrayColor, lightPrimaryColor, primaryColor } from "../layout/constants"
import { gql, useMutation, useQuery } from "@apollo/client"
import { SearchFilterContext } from "../SearchFilterContextProvider"
import AppendableList, { AddItemButton } from "../AppendableList"
import { fromServerGraphResources } from "@/lib/schema"
import { AppContext } from "../AppContextProvider"
import { Banner, IconButton, Text } from "react-native-paper"
import { t } from "@/i18n"
import { View } from "react-native"
import { useContext, useEffect, useState } from "react"
import React from "react"
import ResourceCard from "./ResourceCard"

export const RESOURCES = gql`query MyResources {
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
        deleted
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

export const DELETE_RESOURCE = gql`mutation DeleteResource($resourceId: Int) {
  deleteResource(input: {resourceId: $resourceId}) {
    integer
  }
}`

export const SEND_AGAIN = gql`mutation SendAgain {
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
      appContext.actions.setNewChatMessage(undefined)
      if(appContext.state.account)
        refetch()

      editResourceContext.actions.setChangeCallback(refetch)
      return () => editResourceContext.actions.removeChangeCallback()
    }, [route])

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
          <AppendableList state={{ data, loading, error } as LoadState} dataFromState={state => state.data && fromServerGraphResources(state.data?.myresources?.nodes, appContext.state.categories.data || [])}
              onAddRequested={addRequested} onRefreshRequested={refetch}
              contentContainerStyle={{ gap: 8, padding: aboveMdWidth() ? 20 : 5 }}
              displayItem={(resource, idx) => <ResourceCard resource={resource}
                viewRequested={viewRequested} deleteRequested={resourceId => setDeletingResource(resourceId)}
                editRequested={() => {
                  editResourceContext.actions.setResource(resource)
                  editRequested()
                }}
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
                searchFilterContext.actions.requery(appContext.state.categories.data!)
                setDeletingResource(0)
              } else {
                setDeletingResource(0)
              }
            }} />
    </>
}

const ResourcesListNavigationComponent = ({ route, navigation }: RouteProps) => {
  return <ResourcesList route={route} 
    addRequested={ () => navigation.navigate('newResource') }
    viewRequested={ resourceId => navigation.navigate('viewResource', { resourceId: resourceId })} 
    editRequested={ () => navigation.navigate('editResource') }/>
}

export default ResourcesListNavigationComponent