import Profile from "@/components/account/Profile"
import { AppContextProvider } from "@/components/AppContextProvider"
import DealBoard from "@/components/mainViews/DealBoard"
import { Main } from "@/components/mainViews/MainNavigator"
import Start from "@/components/mainViews/Start"
import { ISecureStore } from "@/lib/secureStore"
import { RouteProps } from "@/lib/utils"
import { Client, QueryResult } from "pg"
import React from "react"
import config from "./config"
import { fireEvent, RenderResult, userEvent, waitFor } from "@testing-library/react-native"
import { TabNavigatorProps } from "@/lib/TabNavigatorProps"

expect.extend({
    toHaveNumericTextContentGreaterOrEqual(received, expected) {
        return { message: () => 'test', pass: false }
    }
})

interface Props extends TabNavigatorProps {
    overrideSecureStore?: ISecureStore
}

const BoardWithSingleComponent = (t: TabNavigatorProps) => (r: RouteProps) => <DealBoard {...r} tabs={[{
    name: t.name, component: t.component
}]} />

const BoardWithComponents = (ts: TabNavigatorProps[] | undefined) => (r: RouteProps) => <DealBoard {...r} tabs={ ts && ts.map(t => ({ name: t.name, component: t.component })) }/>

export const AppWithSingleScreen = (t: Props) => <AppContextProvider>
    <Start splashScreenMinimumDuration={0} overrideSecureStore={t.overrideSecureStore}>
        <Main screens={[{
                name: 'main', component: BoardWithSingleComponent(t)
            }, {
                name: 'profile', component: Profile
            }]} />
    </Start>
</AppContextProvider>

interface MultiScreenProps {
    screens?: TabNavigatorProps[]
    overrideSecureStore?: ISecureStore
}

export const AppWithScreens = (t: MultiScreenProps) => <AppContextProvider>
    <Start splashScreenMinimumDuration={0} overrideSecureStore={t.overrideSecureStore}>
        <Main screens={[{
                name: 'main', component: BoardWithComponents(t.screens)
            }, {
                name: 'profile', component: Profile
            }]} />
    </Start>
</AppContextProvider>

const getOpenConnection = async () => {
    const pgClient = new Client({
        user: config.user,
        host: config.host,
        database: config.database,
        password: config.password,
        port: config.port
    })

    await pgClient.connect()

    return pgClient
}

export const executeQuery = async (query: string, parameters?: any[]): Promise<QueryResult<any>> => {
    const client = await getOpenConnection()
    
    try {
        return await client.query(query , parameters)
    } catch(e) {
        console.error(`Error while executing ${query} with params ${parameters}`, e)
        throw(e)
    } finally {
        client.end()
    }
}

export const checkBadge = async (testID: string, textContent: string, screen : RenderResult) => {
    //Oddly enough, Badge renders two items with the same testID, and the same content. As there is no way to change it, 
    //we just work around it
    await waitFor(async () => expect(await screen.findAllByTestId(testID, { includeHiddenElements: true })).toHaveLength(2))
    const badges = await screen.findAllByTestId(testID, { includeHiddenElements: true })
    expect(badges[0]).toHaveTextContent(textContent)
}

export const checkBadgeNumeric = async (testID: string, screen : RenderResult) => {
    //Oddly enough, Badge renders two items with the same testID, and the same content. As there is no way to change it, 
    //we just work around it
    await waitFor(async () => expect(await screen.findAllByTestId(testID, { includeHiddenElements: true })).toHaveLength(2))
    const badges = await screen.findAllByTestId(testID, { includeHiddenElements: true })
    expect(badges[0]).toHaveTextContent(/\d+/)
}

export const waitForThenPress = async (testId: string, screen: RenderResult, timeout?: number) => {
    await waitFor(() => expect(screen.getByTestId(testId)).toBeOnTheScreen(), { timeout })
    const uv = userEvent.setup()
    uv.press(screen.getByTestId(testId))
}

export const createResourceThroughUI = async (title: string, description: string, expiration: Date, targetScreen: RenderResult, checkSuccess: Boolean = true) => {
    await waitFor(() => expect(targetScreen.getByTestId('categories:Button')).toBeOnTheScreen(), { timeout: 5000 })

    fireEvent.changeText(targetScreen.getByTestId('title'), title)
    fireEvent.changeText(targetScreen.getByTestId('description'), description)
    fireEvent.press(targetScreen.getByTestId('nature:isService:Button'))
    fireEvent.press(targetScreen.getByTestId('exchangeType:canBeExchanged:Button'))

    fireEvent.press(targetScreen.getByTestId('expiration:Button'))
    
    fireEvent(targetScreen.getByTestId('expiration:Picker:date'),
        'onChange',
        expiration
    )
    
    fireEvent.press(targetScreen.getByTestId('categories:Button'))
    await waitFor(() => expect(targetScreen.getByTestId('categories:Modal:ConfirmButton')).toBeOnTheScreen())
    fireEvent.press(targetScreen.getByTestId('categories:Modal:Category:2'))
    fireEvent.press(targetScreen.getByTestId('categories:Modal:Category:11'))
    fireEvent.press(targetScreen.getByTestId('categories:Modal:ConfirmButton'))

    fireEvent.press(targetScreen.getByTestId('submitButton'))
    if(checkSuccess){
        return waitFor(() => expect(targetScreen.getByTestId('resourceEditionFeedback:Success')).toBeOnTheScreen())
    }
}