import AppContextProvider, { AppStateData } from "@/components/scaffold/AppContextProvider"
import i18n from "@/i18n"
import { DocumentNode } from "@apollo/client"
import { MockedResponse, MockedProvider } from '@apollo/react-testing'
import { init, TFunctionProcessReturnValue, TFunctionReturnOptionalDetails } from "i18next"
import { $NoInfer } from "i18next/typescript/helpers"

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

export const appContextDecorator = (initial?: AppStateData) => {
    if(!initial){
        initial = { 
            loading: false, token: '', i18n: { lang: 'fr', translator: (str, opts?) => 'rr' },
            version: 'v0_9'
        }

    }
    return (StoryElement: React.ElementType) => 
        <AppContextProvider initial={initial}>
            <StoryElement/>
        </AppContextProvider>
}
      