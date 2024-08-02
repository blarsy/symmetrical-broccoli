import { LoadState, RouteProps, aboveMdWidth } from "@/lib/utils"
import { EditResourceContext } from "./EditResourceContextProvider"
import ConfirmDialog from "../ConfirmDialog"
import { gql, useMutation, useQuery } from "@apollo/client"
import { SearchFilterContext } from "../SearchFilterContextProvider"
import AppendableList, { AddItemButton } from "../AppendableList"
import { fromServerGraphResources } from "@/lib/schema"
import { Banner, Button } from "react-native-paper"
import { t } from "@/i18n"
import { View } from "react-native"
import { useContext, useEffect, useState } from "react"
import React from "react"
import ResourceCard from "./ResourceCard"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import NoResourceYet from "./NoResourceYet"
import { WhiteButton } from "../layout/lib"

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
      locationBySpecificLocationId {
        address
        id
        latitude
        longitude
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
    const appDispatch = useContext(AppDispatchContext)
    const {data, loading, error, refetch} = useQuery(RESOURCES, { fetchPolicy: 'no-cache' })
    const [deletingResource, setDeletingResource] = useState(0)
    const editResourceContext = useContext(EditResourceContext)
    const searchFilterContext = useContext(SearchFilterContext)
    const [deleteResource] = useMutation(DELETE_RESOURCE)
    const [sendAgain] = useMutation(SEND_AGAIN)
    const [hideBanner, setHideBanner] = useState(false)

    useEffect(() => {
      appDispatch({ type: AppReducerActionType.SetNewChatMessage, payload: undefined })
      if(appContext.account)
        refetch()

      editResourceContext.actions.setChangeCallback(() => {
        refetch()
      })
      return () => editResourceContext.actions.removeChangeCallback()
    }, [route])

    return <>
        <Banner visible={!!appContext.account && !appContext.account.activated && !hideBanner} style={{ alignSelf: 'stretch' }}
            actions={[ { label: t('send_activation_mail_again_button'), onPress: async () => {
                try {
                    await sendAgain()
                } catch(e) {
                    appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e as Error, message: t('error_sending_again') } })
                }
            } }, { label: t('hide_button'), onPress: () => {
                setHideBanner(true)  
            }} ]}>
            {t('activate_account', { email: appContext.account?.email })}
        </Banner>
        { appContext.account ?
          <AppendableList state={{ data, loading, error } as LoadState} dataFromState={state => state.data && fromServerGraphResources(state.data?.myresources?.nodes, appContext.categories.data || [])}
              onAddRequested={addRequested} onRefreshRequested={() => {
                refetch()
              }} noDataLabel={<NoResourceYet/>}
              contentContainerStyle={{ gap: 8, padding: aboveMdWidth() ? 20 : 5 }}
              displayItem={(resource, idx) => <ResourceCard key={idx} resource={resource}
                viewRequested={viewRequested} deleteRequested={resourceId => setDeletingResource(resourceId)}
                editRequested={() => {
                  editResourceContext.actions.setResource(resource)
                  editRequested()
                }}
              />}
          /> :
          <View style={{ flexDirection: 'column', alignItems:'stretch', margin: 10 }}>
            <WhiteButton mode="outlined" icon="plus" onPress={addRequested}>{t('add_buttonLabel')}</WhiteButton>
            <NoResourceYet />
          </View>
        }
        <ConfirmDialog title={t('Confirmation_DialogTitle')} question={t('Confirm_Resource_Delete_Question')}
            visible={!!deletingResource} onResponse={async response => {
              if(response) {
                await deleteResource({ variables: {
                  resourceId: deletingResource
                } })
                await refetch()
                searchFilterContext.actions.requery(appContext.categories.data!)
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