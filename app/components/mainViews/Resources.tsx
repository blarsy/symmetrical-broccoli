import React from "react"
import { RouteProps } from "@/lib/utils"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import SimpleBackHeader from "../layout/SimpleBackHeader"
import EditResource from "../form/EditResource"
import ViewResource from "../resources/ViewResource"
import ResourcesList from "../resources/ResourcesList"

const StackNav = createNativeStackNavigator()

const Resources = ({ route, navigation }: RouteProps) => {
  return <StackNav.Navigator screenOptions={{ contentStyle: { backgroundColor: '#fff' } }}>
      <StackNav.Screen name="resources" component={ResourcesList} options={{ headerShown: false }} />
      <StackNav.Screen name="newResource" key="newResource" options={{ header: SimpleBackHeader }} component={EditResource} initialParams={{isNew: true}}/>
      <StackNav.Screen name="viewResource" key="viewResource" options={{ header: SimpleBackHeader }} component={ViewResource} />
      <StackNav.Screen name="editResource" key="editResource" options={{ header: SimpleBackHeader }} component={EditResource} />
  </StackNav.Navigator>
}

export default Resources