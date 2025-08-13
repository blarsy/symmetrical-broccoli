import { LoadState, RouteProps, aboveMdWidth } from "@/lib/utils"
import { EditResourceContext } from "./EditResourceContextProvider"
import ConfirmDialog from "../ConfirmDialog"
import { gql, useMutation, useQuery } from "@apollo/client"
import { SearchFilterContext } from "../SearchFilterContextProvider"
import AppendableList from "../AppendableList"
import { fromServerGraphResources, Resource } from "@/lib/schema"
import { Banner } from "react-native-paper"
import { t } from "@/i18n"
import { View } from "react-native"
import { useContext, useEffect, useState } from "react"
import React from "react"
import ResourceCard from "./ResourceCard"
import { AppAlertDispatchContext, AppAlertReducerActionType, AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import NoResourceYet from "./NoResourceYet"
import { WhiteButton } from "../layout/lib"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import { GraphQlLib } from "@/lib/backendFacade"
import ContributeDialog from "../tokens/ContributeDialog"

const NUMBER_OF_FREE_RESOURCES = 2
export const RESOURCES = gql`query MyResources {
  myResources {
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
      suspended
      price
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
    const appAlertDispatch = useContext(AppAlertDispatchContext)
    const {data, loading, error, refetch} = useQuery(RESOURCES, { fetchPolicy: 'no-cache' })
    const [explainingContributionMode, setExplainingContributionMode] = useState(false)
    const [resources, setResources] = useState<Resource[]>([])
    const [deletingResource, setDeletingResource] = useState(0)
    const editResourceContext = useContext(EditResourceContext)
    const searchFilterContext = useContext(SearchFilterContext)
    const [deleteResource] = useMutation(GraphQlLib.mutations.DELETE_RESOURCE)
    const [sendAgain] = useMutation(SEND_AGAIN)
    const [hideBanner, setHideBanner] = useState(false)
    const { reloadAccount } = useUserConnectionFunctions()

    useEffect(() => {
      appDispatch({ type: AppReducerActionType.SetNewChatMessage, payload: undefined })
      if(appContext.account)
        refetch()

      editResourceContext.actions.setChangeCallback(() => {
        refetch()
      })
      return () => editResourceContext.actions.removeChangeCallback()
    }, [route])

    useEffect(() => {
      if(data) {
        setResources(fromServerGraphResources(data.myResources?.nodes, appContext.categories.data || []))
      }
    }, [data, appContext.lastResourceChangedTimestamp])

    const ensureContributionExplained = (resources: Resource[], addRequested: () => void) => {
      if(resources.filter((res => !res.deleted && ((res.expiration && new Date(res.expiration) > new Date()) || res.expiration === null))).length < NUMBER_OF_FREE_RESOURCES){
        addRequested()
      } else {
        if(!appContext.account!.willingToContribute && (!appContext.account?.unlimitedUntil || appContext.account?.unlimitedUntil < new Date())) {
          setExplainingContributionMode(true)
        } else {
          addRequested()
        }
      }
    }

    return <>
        <Banner visible={!!appContext.account && !appContext.account.activated && !hideBanner} style={{ alignSelf: 'stretch' }}
            actions={[ {
              label: t('refreshButton'), onPress: () => {
                reloadAccount()
            } }, { label: t('send_activation_mail_again_button'), onPress: async () => {
                try {
                    await sendAgain()
                } catch(e) {
                  appAlertDispatch({ type: AppAlertReducerActionType.DisplayNotification, payload: { error: e as Error, message: t('error_sending_again') } })
                }
            } }, { label: t('hide_button'), onPress: () => {
                setHideBanner(true)  
            }} ]}>
            {t('activate_account', { email: appContext.account?.email })}
        </Banner>
        { appContext.account ?
          <AppendableList testID="ResourcesAppendableList" state={{ data: resources, loading, error } as LoadState} dataFromState={state => state.data}
            onAddRequested={() => {
              ensureContributionExplained(resources, addRequested)
            }} onRefreshRequested={() => {
              refetch()
            }} noDataLabel={<NoResourceYet/>}
            contentContainerStyle={{ gap: 8, padding: aboveMdWidth() ? 20 : 5, flexDirection: 'row', flexWrap: 'wrap',
              borderColor: 'yellow', borderWidth: 0
            }}
            displayItem={(resource: any, idx) => <ResourceCard testID={`resourceList:ResourceCard:${resource.id}`}
              key={idx} resource={resource}
              viewRequested={viewRequested} deleteRequested={resourceId => setDeletingResource(resourceId)}
              editRequested={() => {
                editResourceContext.actions.setResource(resource)
                editRequested()
              }}
            />}
          />
           :
          <View style={{ margin: 10, flexDirection: 'column', borderColor: 'green', borderWidth: 0, flex: 1 }}>
            <WhiteButton testID="addResourceButton" mode="outlined" icon="plus" onPress={addRequested}>{t('add_buttonLabel')}</WhiteButton>
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
            }} onDismiss={() => setDeletingResource(0)}/>
        <ContributeDialog testID="SwitchToContributionModeDialog" onBecameContributor={() => {
          setExplainingContributionMode(false)
          addRequested()
        }} onDismiss={() => setExplainingContributionMode(false)} visible={explainingContributionMode}
            title={t('contributionExplainationDialogTitle')} />
    </>
}

const ResourcesListNavigationComponent = ({ route, navigation }: RouteProps) => {
  return <ResourcesList route={route} 
    addRequested={ () => navigation.navigate('newResource') }
    viewRequested={ resourceId => navigation.navigate('viewResource', { resourceId: resourceId })} 
    editRequested={ () => navigation.navigate('editResource') }/>
}

export default ResourcesListNavigationComponent