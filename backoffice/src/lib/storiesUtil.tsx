import AppContextProvider, { AppStateData } from "@/components/scaffold/AppContextProvider"
import { getCommonConfig } from "@/config"
import { DocumentNode } from "@apollo/client"
import { MockedResponse, MockedProvider } from '@apollo/react-testing'
import { APIProvider } from "@vis.gl/react-google-maps"
import { fromData } from "./DataLoadState"
import UiContextProvider, { UiStateData } from "@/components/scaffold/UiContextProvider"
const { mapsApiKey } = getCommonConfig()

export interface GraphQlOp {
    query: DocumentNode,
    result: any,
    variables?: Record<string, any>
}

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
            unreadNotifications: []
        }

    }
    return (StoryElement: React.ElementType) => 
        <AppContextProvider initial={initial}>
            <StoryElement/>
        </AppContextProvider>
}
      