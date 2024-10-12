import Profile from "@/components/account/Profile";
import { AppContextProvider } from "@/components/AppContextProvider";
import { TabNavigatorProps } from "@/components/DealNavigator";
import DealBoard from "@/components/mainViews/DealBoard";
import { Main } from "@/components/mainViews/MainNavigator";
import Start from "@/components/mainViews/Start";
import { ISecureStore } from "@/lib/secureStore";
import { RouteProps } from "@/lib/utils";
import React from "react";

interface Props extends TabNavigatorProps {
    overrideSecureStore?: ISecureStore
}

const BoardWithSingleComponent = (t: TabNavigatorProps) => (r: RouteProps) =>  <DealBoard {...r} tabs={[{
    name: t.name, component: t.component
}]} />

export const AppWithSingleScreen = (t: Props) => <AppContextProvider>
    <Start splashScreenMinimumDuration={0} overrideSecureStore={t.overrideSecureStore}>
        <Main screens={[{
                name: 'main', component: BoardWithSingleComponent(t)
            }, {
                name: 'profile', component: Profile
            }]} />
    </Start>
</AppContextProvider>