import React from "react"
import { t } from '@/i18n'
import AccordionItem from "@/components/form/AccordionItem"
import EditProfile from "@/components/form/EditProfile"
import MyNetwork from "@/components/MyNetwork"
import MyResources from "@/components/mainViews/MyResources"
import PrimaryColoredContainer from "@/components/layout/PrimaryColoredContainer"
import { View } from "react-native"

export default function Profile () {
    return <PrimaryColoredContainer style={{ alignItems: "stretch", justifyContent: 'flex-start' }}>
        <View style={{ flex: 1, flexDirection: 'column' }}>
            <AccordionItem title={t('networkAccordionTitle')}>
                <MyNetwork />
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