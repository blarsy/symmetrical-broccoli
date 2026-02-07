import { LoadState, RouteProps, aboveMdWidth } from "@/lib/utils"
import { EditResourceContext } from "./EditResourceContextProvider"
import ConfirmDialog from "../ConfirmDialog"
import { gql, useMutation, useQuery } from "@apollo/client"
import { SearchFilterContext } from "../SearchFilterContextProvider"
import AppendableList from "../AppendableList"
import { fromServerGraphResources, Resource } from "@/lib/schema"
import { Banner, Icon, Text } from "react-native-paper"
import { t } from "@/i18n"
import { TouchableOpacity, View } from "react-native"
import { useCallback, useContext, useEffect, useState } from "react"
import React from "react"
import ResourceCard from "./ResourceCard"
import { AppAlertDispatchContext, AppAlertReducerActionType, AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import NoResourceYet from "./NoResourceYet"
import { WhiteButton } from "../layout/lib"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import { GraphQlLib } from "@/lib/backendFacade"
import BareIconButton from "../layout/BareIconButton"
import Images from "@/Images"
import { useFocusEffect } from "@react-navigation/native"
import { primaryColor } from "../layout/constants"
import CampaignExplanationDialog from "../account/CampaignExplanationDialog"
import useActiveCampaign from "@/lib/useActiveCampaign"

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
      price
      accountsPublicDatumByAccountId {
        id
        name
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
      campaignsResourcesByResourceId {
        nodes {
          campaignId
        }
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
  addRequested: (campaignId? : string) => void
  viewRequested: (resourceId: string) => void
  editRequested: () => void
}

export const ResourcesList = ({ route, addRequested, viewRequested, editRequested }: ResourceListProps) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const appAlertDispatch = useContext(AppAlertDispatchContext)
    const {data, loading, error, refetch} = useQuery(RESOURCES, { fetchPolicy: 'no-cache' })
    const [resources, setResources] = useState<Resource[]>([])
    const [deletingResource, setDeletingResource] = useState<string | undefined>()
    const editResourceContext = useContext(EditResourceContext)
    const searchFilterContext = useContext(SearchFilterContext)
    const [deleteResource] = useMutation(GraphQlLib.mutations.DELETE_RESOURCE)
    const { activeCampaign, load: reloadCampaign} = useActiveCampaign()
    const [sendAgain] = useMutation(SEND_AGAIN)
    const [hideBanner, setHideBanner] = useState(false)
    const { reloadAccount } = useUserConnectionFunctions()
    const [ showCampaignExplanationCallback, setShowCampaignExplanationCallback ] = useState<{ callback: (() => void) | undefined }>({ callback: undefined })

    useFocusEffect(useCallback(() => {
      reloadCampaign()
    }, []))

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
        setResources(fromServerGraphResources(data.myResources?.nodes, appContext.categories.data || [], activeCampaign.data?.id))
      }
    }, [data, activeCampaign.data, appContext.lastResourceChangedTimestamp])

    const ensureCampaignsExplained = (cb: () => void) => {
      if(!appContext.account?.knowsAboutCampaigns) {
        setShowCampaignExplanationCallback({ callback: () => {
          cb()
        } })
      } else {
        cb()
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
        { appContext.account ? <>
          { activeCampaign.data && <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', margin: 6, gap: 6 }}>
            <TouchableOpacity style={{ flexDirection: 'row', backgroundColor: primaryColor, padding: 15, borderRadius: 15, borderColor: '#000', borderWidth: 1, gap: 6, alignItems: 'center' }} onPress={() => {
                ensureCampaignsExplained(() => addRequested(activeCampaign.data!.id))
            }}>
              <Icon source="plus" size={25} color="#fff"/>
              <View style={{ flexDirection: 'column' }}>
                <Text variant="labelLarge" style={{ color: '#fff' }}>{activeCampaign.data.name}</Text>
                <Text variant="labelMedium" style={{ color: '#fff' }}>{t('rewardsMutlipliedBy')}{activeCampaign.data.resourceRewardsMultiplier}</Text>
              </View>
            </TouchableOpacity>
            <BareIconButton Image={Images.Question} style={{ margin: 6 }} size={20} onPress={() => {
              setShowCampaignExplanationCallback({ callback: () => {}})
            }} />
          </View> }
            <AppendableList testID="ResourcesAppendableList" state={{ data: resources, loading, error } as LoadState} dataFromState={state => state.data}
              onAddRequested={() => addRequested()} onRefreshRequested={() => {
                refetch()
              }} noDataLabel={<NoResourceYet/>}
              contentContainerStyle={{ gap: 8, padding: aboveMdWidth() ? 20 : 5, flexDirection: 'row', 
                flexWrap: 'wrap'
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
          </>
           :
          <View style={{ margin: 10, flexDirection: 'column', borderColor: 'green', borderWidth: 0, flex: 1 }}>
            <WhiteButton testID="addResourceButton" mode="outlined" icon="plus" onPress={() => addRequested()}>{t('add_buttonLabel')}</WhiteButton>
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
                setDeletingResource(undefined)
              } else {
                setDeletingResource(undefined)
              }
            }} onDismiss={() => setDeletingResource(undefined)}/>
        <CampaignExplanationDialog onDismiss={() =>{
          showCampaignExplanationCallback.callback!()
          setShowCampaignExplanationCallback({ callback: undefined})
        }} campaign={showCampaignExplanationCallback.callback && activeCampaign.data} />
    </>
}

const ResourcesListNavigationComponent = ({ route, navigation }: RouteProps) => {
  return <ResourcesList route={route} 
    addRequested={ (campaignId) => navigation.navigate('newResource', { isNew: true, campaignId }) }
    viewRequested={ resourceId => navigation.navigate('viewResource', { resourceId: resourceId })} 
    editRequested={ () => navigation.navigate('editResource') }/>
}

export default ResourcesListNavigationComponent