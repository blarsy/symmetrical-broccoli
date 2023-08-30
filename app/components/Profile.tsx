import React from "react"
import { t } from '../i18n'
import { Stack } from "@react-native-material/core"
import AccordionItem from "./form/AccordionItem"
import EditProfile from "./form/EditProfile"
import Network from "./Network"

export default function Profile () {
    return <Stack>
        <AccordionItem title={t('friendsAccordionTitle')}>
            <Network />
        </AccordionItem>
        <AccordionItem title={t('editProfileAccordionTitle')}>
            <EditProfile />
        </AccordionItem>
    </Stack>
}