import { t } from "@/i18n"
import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import React, { useState } from "react"
import { ActivityIndicator, Dialog, IconButton, Portal, Snackbar, Text } from "react-native-paper"
import { primaryColor } from "./layout/constants"

interface Props {
    visible: boolean
    onResponse: (confirmed: Boolean) => Promise<void>
    title: string
    question: string
}

const ConfirmDialog = ({ visible, onResponse, title, question }: Props) => {
    const [processing, setProcessing] = useState(initial<null>(false, null))
    return <Portal>
        <Dialog visible={visible} style={{ backgroundColor: '#fff' }}>
            <Dialog.Title><Text variant="titleLarge">{title}</Text></Dialog.Title>
            <Dialog.Content>
                <Text variant="bodyMedium">{question}</Text>
                { processing.loading && <ActivityIndicator /> }
                <Portal>
                    <Snackbar visible={!!processing.error} onDismiss={() => setProcessing(initial(false, null))}>{processing.error && processing.error.message}</Snackbar>
                </Portal>
            </Dialog.Content>
            <Dialog.Actions>
                <IconButton size={30} iconColor="#000" icon="check" onPress={async () => {
                    setProcessing(beginOperation())
                    try {
                        await onResponse(true)
                        setProcessing(fromData(null))
                    } catch(e) {
                        setProcessing(fromError(e, t('requestError')))
                    }
                } }/>
                <IconButton size={30} icon="close" iconColor={primaryColor} onPress={async () => { onResponse(false) } }/>
            </Dialog.Actions>
        </Dialog>
    </Portal>
}

export default ConfirmDialog