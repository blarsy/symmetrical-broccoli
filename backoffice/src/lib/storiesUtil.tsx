import AppContextProvider, { AppStateData } from "@/components/scaffold/AppContextProvider"
import { getCommonConfig } from "@/config"
import { DocumentNode } from "@apollo/client"
import { MockedProvider, MockedResponse } from '@apollo/client/testing'
import { APIProvider } from "@vis.gl/react-google-maps"
import { fromData } from "./DataLoadState"
import UiContextProvider, { UiStateData } from "@/components/scaffold/UiContextProvider"
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import '../app/globals.css'
import ClientWrapper from "@/components/scaffold/ClientWrapper"
import { ReactNode } from "react"
const { mapsApiKey } = getCommonConfig()

export interface GraphQlOp {
    query: DocumentNode,
    result: any,
    variables?: Record<string, any>
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

export const clientComponentDecorator = (Story: () => ReactNode) => {
    return <ClientWrapper version="v0_9">
        <Story/>
    </ClientWrapper>
}