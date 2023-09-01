import { Box } from "@react-native-material/core"
import { BottomTabBarProps } from "@react-navigation/bottom-tabs"
import React from "react"
import { Text, TouchableOpacity, View } from "react-native"
import { lightPrimaryColor, primaryColor } from "./layout/constants"

const AppTabs = ({ descriptors, navigation, state }: BottomTabBarProps) => {
    return <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 5, backgroundColor: lightPrimaryColor }}>
        {state.routes.map((route, index) => {
            const { options } = descriptors[route.key]
            const isFocused = state.index === index
            const label =
                (options.tabBarLabel !== undefined
                ? options.tabBarLabel
                : options.title !== undefined
                ? options.title
                : route.name) as string
            return <TouchableOpacity
                key={index}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={() => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    })
        
                    if (!isFocused && !event.defaultPrevented) {
                        // The `merge: true` option makes sure that the params inside the tab screen are preserved
                        navigation.navigate({ name: route.name, params: {}, merge: true })
                    }
                }}
                style={{ flex: 1 }} >
                    <Box style={{ display: 'flex', flexDirection: 'column', justifyContent:'center', alignItems:'center' }}>
                        {options.tabBarIcon  && options.tabBarIcon({ focused: isFocused, size: 30, color: isFocused ? primaryColor: '#000' })}
                        <Text style={{ color: isFocused ? primaryColor : '#222' }}>{label}</Text>
                    </Box>
            </TouchableOpacity>
        })}
    </View>

}

export default AppTabs