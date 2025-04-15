import AppContextProvider, { AppStateData } from "@/components/scaffold/AppContextProvider"
import { getCommonConfig } from "@/config"
import { DocumentNode } from "@apollo/client"
import { MockedResponse, MockedProvider } from '@apollo/react-testing'
import { APIProvider } from "@vis.gl/react-google-maps"
import { fromData } from "./DataLoadState"
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

export const appContextDecorator = (initial?: AppStateData) => {
    if(!initial){
        initial = {
            loading: false, token: '', i18n: { lang: 'fr', translator: (str, opts?) => `tr-${str}` },
            version: 'v0_9',
            categories: fromData([])
        }

    }
    return (StoryElement: React.ElementType) => 
        <AppContextProvider initial={initial}>
            <StoryElement/>
        </AppContextProvider>
}
      