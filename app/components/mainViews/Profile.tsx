import React from "react"
import EditProfile from "@/components/form/EditProfile"
import PrimaryColoredContainer from "@/components/layout/PrimaryColoredContainer"
import { View } from "react-native"

export default function Profile () {
    return <PrimaryColoredContainer style={{ alignItems: "stretch", justifyContent: 'flex-start' }}>
        <View style={{ flex: 1, flexDirection: 'column' }}>
            <EditProfile />
        </View>
    </PrimaryColoredContainer>
}