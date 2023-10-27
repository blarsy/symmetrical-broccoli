import React from "react"
import EditProfile from "@/components/form/EditProfile"
import PrimaryColoredContainer from "@/components/layout/PrimaryColoredContainer"
import { ScrollView } from "react-native"
import { isMdWidth, mdScreenWidth } from "@/lib/settings"

export default function Profile () {
    return <PrimaryColoredContainer style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ScrollView style={{ flex: 1, flexDirection: 'column', margin: 10, 
            alignSelf: "stretch", gap: 30, maxWidth: isMdWidth() ? mdScreenWidth : 'auto' }}>
            <EditProfile />
        </ScrollView>
    </PrimaryColoredContainer>
}