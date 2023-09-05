import React from "react"
import { t } from '../i18n'
import AccordionItem from "./form/AccordionItem"
import EditProfile from "./form/EditProfile"
import Network from "./Network"
import MyResources from "./MyResources"
import PrimaryColoredContainer from "./layout/PrimaryColoredContainer"
import { View } from "react-native"

export default function Profile () {
    return <PrimaryColoredContainer style={{ alignItems: "stretch", justifyContent: 'flex-start' }}>
        <View style={{ flex: 1, flexDirection: 'column' }}>
            <AccordionItem title={t('networkAccordionTitle')}>
                <Network />
            </AccordionItem>
            <AccordionItem title={t('profileSettingsAccordionTitle')}>
                <EditProfile />
            </AccordionItem>
            <AccordionItem title={t('myResourcesAccordionTitle')}>
                <MyResources />
            </AccordionItem>
        </View>
    </PrimaryColoredContainer>
}