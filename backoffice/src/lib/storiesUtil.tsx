import AppContextProvider, { AppStateData } from "@/components/scaffold/AppContextProvider"
import { getCommonConfig } from "@/config"
import { DocumentNode } from "@apollo/client"
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { APIProvider } from "@vis.gl/react-google-maps"
import { fromData, initial } from "./DataLoadState"
import UiContextProvider, { UiStateData } from "@/components/scaffold/UiContextProvider"
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import '../app/globals.css'
import { Translatable } from "@/components/scaffold/ClientWrapper"
import { ReactNode } from "react"
import ChatContextProvider, { ChatStateData } from "@/components/scaffold/ChatContextProvider"
import { AccountInfo } from "./useAccountFunctions"
import { GET_CATEGORIES } from "./useCategories"
const { mapsApiKey } = getCommonConfig()

export interface GraphQlOp {
    query: DocumentNode,
    result: any,
    variables?: Record<string, any>
}

const defaultAccount: AccountInfo = {
    id: 123, name: 'Super artisan', activated: new Date(new Date().valueOf() - 10000),
    willingToContribute: true, amountOfTokens: 20, email: 'arti@san.super', lastChangeTimestamp: new Date(),
    unlimitedUntil: null, avatarPublicId: '', knowsAboutCampaigns: false
}

export const makeDbRresource = (title: string, description: string, deleted: Date | null, creatorName: string, imagesPublicIds: string[], expiration: Date | null = null, suspended: Date | null = null) => ({
    id: new Date().valueOf(),
    expiration: null,
    description,
    created: new Date(),
    isProduct: true,
    isService: true,
    title,
    canBeTakenAway: true,
    canBeExchanged: true,
    canBeGifted: true,
    canBeDelivered: true,
    deleted,
    suspended,
    price: 0,
    accountByAccountId: {
        id: new Date().valueOf(),
        name: creatorName,
        email: 'mail'
    },
    resourcesImagesByResourceId: {
        nodes: imagesPublicIds.map((publicId: string) => ({
            imageByImageId: {
                created: new Date(),
                id: new Date().valueOf(),
                publicId
            }
        }))
    },
    resourcesResourceCategoriesByResourceId: {
        nodes: {
            resourceCategoryCode: 1
        }
    },
    locationBySpecificLocationId: {
        address: 'rue chouetasse, 1',
        id: new Date().valueOf(),
        latitude: 53.43,
        longitude: 2.434
    }
})

export const apolloClientMocksDecorator = (ops: GraphQlOp[]) => 
    (Story: React.ElementType) => {
        return <MockedProvider mocks={
            ops.map(op => ({
                delay: 2000,
                request: { query: op.query, variables: op.variables },
                result: { data: op.result }
            } as MockedResponse<any, any>))
        }>
            <Story />
        </MockedProvider>
    }

export const MapsProviderDecorator = (Story: React.ElementType) => {
    return <APIProvider apiKey={mapsApiKey} >
        <Story/>
    </APIProvider>
}

export const uiContextDecorator = (initial?: UiStateData) => {
    if(!initial){
        initial = {
            loading: false, i18n: { lang: 'fr', translator: (str, opts?) => `tr-${str}` },
            version: 'v0_10',
            categories: fromData([])
        }

    }
    return (StoryElement: React.ElementType) => 
        <UiContextProvider initial={initial}>
            <StoryElement/>
        </UiContextProvider>
}

export const chatContextDecorator = (initial?: ChatStateData) => {
    if(!initial) {
        initial = {
            conversations: [],
            unreadConversations: [],
        }
    }

    return (Story: React.ElementType) =>
        <ChatContextProvider initial={initial}>
            <Story />
        </ChatContextProvider>
}

export const appContextDecorator = (initial?: AppStateData) => {
    if(!initial){
        initial = {
            token: '',
            unreadNotifications: [],
            loading: false,
            subscriptions: []
        }

    }
    return (StoryElement: React.ElementType) => 
        <AppContextProvider initial={initial}>
            <StoryElement/>
        </AppContextProvider>
}

export const configDayjsDecorator = (Story: React.ElementType) => {
    dayjs.extend(relativeTime)
    dayjs.locale('fr')
    dayjs.extend(utc)
    return <Story />
}

export const clientComponentDecorator = (initialAppstate?: AppStateData, initialChatState?: ChatStateData, 
    initialUiState?: UiStateData, ops?: GraphQlOp[]) => {
    const actualOps: GraphQlOp[] = [{
        query: GET_CATEGORIES,
        variables: { locale: 'fr' },
        result : {
            allResourceCategories: { 
                nodes: []
            }
        }
    }]
    if(ops) {
        actualOps.push(...ops)
    }

    return (Story: () => ReactNode) =>  <AppContextProvider initial={initialAppstate || { token: '', unreadNotifications: [], loading: false, subscriptions: []}}>
        <ChatContextProvider initial={initialChatState || { conversations: [], unreadConversations: [] }}>
            <UiContextProvider initial={ initialUiState || { loading: false, i18n: { lang: 'fr', translator: (str, opts?) => `tr-${str}` }, version: 'v0_10', categories: initial(false) }}>
                <Translatable version="v0_10">
                    <MockedProvider mocks={
                        actualOps.map(op => ({
                            delay: 2000,
                            request: { query: op.query, variables: op.variables },
                            result: { data: op.result }
                        } as MockedResponse<any, any>))
                    }>
                        <Story />
                    </MockedProvider>
                </Translatable>
            </UiContextProvider>
        </ChatContextProvider>
    </AppContextProvider>
}

export const connectedComponent = (ops?: GraphQlOp[]) => clientComponentDecorator({ loading: false, account: defaultAccount, token: 'token', unreadNotifications: [], subscriptions: [] }, undefined, undefined, ops)

export const defaultCampaign = {
    airdrop: new Date(new Date().valueOf() + 10000),
    airdropAmount: 5000,
    beginning: new Date(),
    created: new Date(),
    defaultResourceCategories: [],
    description: 'Ici, un texte engageant qui explique le thème de la campagne.',
    ending: new Date(new Date().valueOf() + 100000),
    id: 1,
    name: 'Vive la rentrée !',
    resourceRewardsMultiplier: 5
}