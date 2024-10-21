import Profile from "@/components/account/Profile";
import { AppContextProvider } from "@/components/AppContextProvider";
import { TabNavigatorProps } from "@/components/DealNavigator";
import DealBoard from "@/components/mainViews/DealBoard";
import { Main } from "@/components/mainViews/MainNavigator";
import Start from "@/components/mainViews/Start";
import { ISecureStore } from "@/lib/secureStore";
import { RouteProps } from "@/lib/utils";
import { Client, QueryResult } from "pg";
import React from "react";
import config from "./config";

interface Props extends TabNavigatorProps {
    overrideSecureStore?: ISecureStore
}

const BoardWithSingleComponent = (t: TabNavigatorProps) => (r: RouteProps) => <DealBoard {...r} tabs={[{
    name: t.name, component: t.component
}]} />

const BoardWithComponents = (ts: TabNavigatorProps[]) => (r: RouteProps) => <DealBoard {...r} tabs={ ts.map(t => ({ name: t.name, component: t.component })) }/>

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
    screens: TabNavigatorProps[]
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
    
    console.log('executing', query, parameters)
    return await client.query(query , parameters)
}