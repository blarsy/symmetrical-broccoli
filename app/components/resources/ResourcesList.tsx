import { LoadState, RouteProps, aboveMdWidth } from "@/lib/utils"
import { EditResourceContext } from "./EditResourceContextProvider"
import ConfirmDialog from "../ConfirmDialog"
import { gql, useMutation, useQuery } from "@apollo/client"
import { SearchFilterContext } from "../SearchFilterContextProvider"
import AppendableList from "../AppendableList"
import { fromServerGraphResources, Resource } from "@/lib/schema"
import { Banner, Text } from "react-native-paper"
import { t } from "@/i18n"
import { View } from "react-native"
import { useContext, useEffect, useState } from "react"
import React from "react"
import ResourceCard from "./ResourceCard"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import NoResourceYet from "./NoResourceYet"
import { WhiteButton } from "../layout/lib"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import Tokens from "../tokens/Tokens"
import { GraphQlLib } from "@/lib/backendFacade"

const NUMBER_OF_FREE_RESOURCES = 2
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
      suspended
      subjectiveValue
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
    const [switchToContributionMode] = useMutation(GraphQlLib.mutations.SWITCH_TO_CONTRIBUTION_MODE)
    const [askingSwitchToContributionMode, setAskingSwitchToContributionMode] = useState(false)
    const [resources, setResources] = useState<Resource[]>([])
    const [deletingResource, setDeletingResource] = useState(0)
    const editResourceContext = useContext(EditResourceContext)
    const searchFilterContext = useContext(SearchFilterContext)
    const [deleteResource] = useMutation(DELETE_RESOURCE)
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
        setResources(fromServerGraphResources(data.myresources?.nodes, appContext.categories.data || []))
      }
    }, [data])

    const ensureContributionEnforced = (resources: Resource[], addRequested: () => void) => {
      if(resources.filter((res => !res.deleted && (res.expiration && new Date(res.expiration) > new Date()))).length < NUMBER_OF_FREE_RESOURCES){
        addRequested()
      } else {
        if(!appContext.account!.willingToContribute && (!appContext.account?.unlimitedUntil || appContext.account?.unlimitedUntil < new Date())) {
          setAskingSwitchToContributionMode(true)
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
                    appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e as Error, message: t('error_sending_again') } })
                }
            } }, { label: t('hide_button'), onPress: () => {
                setHideBanner(true)  
            }} ]}>
            {t('activate_account', { email: appContext.account?.email })}
        </Banner>
        { appContext.account ?
          <>
            { appContext.account.willingToContribute && <Tokens testID="Tokens" account={appContext.account} style={{ marginTop: 5 }} />}
            <AppendableList testID="ResourcesAppendableList" state={{ data: resources, loading, error } as LoadState} dataFromState={state => state.data}
              onAddRequested={() => {
                ensureContributionEnforced(resources, addRequested)
              }} onRefreshRequested={() => {
                refetch()
              }} noDataLabel={<NoResourceYet/>}
              contentContainerStyle={{ gap: 8, padding: aboveMdWidth() ? 20 : 5, flexDirection: 'row', flexWrap: 'wrap',
                borderColor: 'yellow', borderWidth: 0
              }}
              displayItem={(resource, idx) => <ResourceCard testID={`resourceList:ResourceCard:${resource.id}`}
                key={idx} resource={resource}
                viewRequested={viewRequested} deleteRequested={resourceId => setDeletingResource(resourceId)}
                editRequested={() => {
                  editResourceContext.actions.setResource(resource)
                  editRequested()
                }}
              />}
          />
          </>
           :
          <View style={{ margin: 10, flexDirection: 'column', borderColor: 'green', borderWidth: 0, flex: 1 }}>
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
            }} onDismiss={() => setDeletingResource(0)}/>
        <ConfirmDialog testID="SwitchToContributionModeDialog" title={t('SwitchToContributionMode_DialogTitle')} content={<View>
            <Text>{t('Contribution_tip', { numberOfFreeResources: NUMBER_OF_FREE_RESOURCES })}</Text>
            <Text>{t('Contribution_explain1', { numberOfFreeResources: NUMBER_OF_FREE_RESOURCES })}</Text>
            <Text>{t('Contribution_explain_token')}</Text>
            <Text variant="headlineSmall">{t('Contribution_subTitle')}</Text>
            <Text>{t('Contribution_explain2')}</Text>
            <Text variant="headlineMedium">{t('Contribution_gifts_title')}</Text>
            <Text variant="labelSmall">{t('Contribution_gift_1')}</Text>
            <Text variant="labelSmall">{t('Contribution_gift_2')}</Text>
            <Text variant="labelSmall">{t('Contribution_gift_3')}</Text>
            <Text variant="titleMedium">{t('SwitchToContributionMode_Question')}</Text>
          </View>} visible={askingSwitchToContributionMode} onResponse={async response => {
              if(response) {
                await switchToContributionMode()
                await reloadAccount()
                addRequested()
              }
              setAskingSwitchToContributionMode(false)
        }} onDismiss={() => setAskingSwitchToContributionMode(false)} />
    </>
}

const ResourcesListNavigationComponent = ({ route, navigation }: RouteProps) => {
  return <ResourcesList route={route} 
    addRequested={ () => navigation.navigate('newResource') }
    viewRequested={ resourceId => navigation.navigate('viewResource', { resourceId: resourceId })} 
    editRequested={ () => navigation.navigate('editResource') }/>
}

export default ResourcesListNavigationComponent