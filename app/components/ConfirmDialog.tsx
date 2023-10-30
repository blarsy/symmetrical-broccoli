import { t } from "@/i18n"
import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import React, { useState } from "react"
import { ActivityIndicator, Button, Dialog, IconButton, Portal, Snackbar, Text } from "react-native-paper"

interface Props {
    visible: boolean
    onResponse: (confirmed: Boolean) => Promise<void>
    title: string
    question: string
}

const ConfirmDialog = ({ visible, onResponse, title, question }: Props) => {
    const [processing, setProcessing] = useState(initial<null>(false))
    return <Portal>
        <Dialog visible={visible}>
            <Dialog.Title>{title}</Dialog.Title>
            <Dialog.Content>
                <Text variant="bodyMedium">{question}</Text>
                { processing.loading && <ActivityIndicator /> }
                <Snackbar visible={!!processing.error} onDismiss={() => setProcessing(initial(false))}>{processing.error && processing.error.message}</Snackbar>
            </Dialog.Content>
            <Dialog.Actions>
            <IconButton size={30} icon="check" onPress={async () => {
                    setProcessing(beginOperation())
                    try {
                        await onResponse(true)
                        setProcessing(fromData(null))
                    } catch(e) {
                        setProcessing(fromError(e, t('requestError')))
                    }
                } }/>
                <IconButton size={30} icon="close" iconColor="red" onPress={async () => { onResponse(false) } }/>
            </Dialog.Actions>
        </Dialog>
    </Portal>
}

export default ConfirmDialog