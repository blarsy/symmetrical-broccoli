import { Button, VStack } from "@react-native-material/core"
import React, { useEffect } from "react"
import { Divider } from "react-native-flex-layout"
import { t } from '../i18n'

export default function EditResource () {
    useEffect(() => {
        
    }, [])
    return <VStack>
        <Button title={t('create_label')} onPress={e => {

        }}/>
        <Divider/>

    </VStack>
}