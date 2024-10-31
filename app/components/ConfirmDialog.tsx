import { t } from "@/i18n"
import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import React, { useState } from "react"
import { ActivityIndicator, Dialog, IconButton, Portal, Text } from "react-native-paper"
import { lightPrimaryColor, primaryColor } from "./layout/constants"
import { ErrorSnackbar } from "./OperationFeedback"
import Images from "@/Images"

interface Props {
    visible: boolean
    onResponse: (confirmed: Boolean) => Promise<void>
    title: string
    question: string
}

const ConfirmDialog = ({ visible, onResponse, title, question }: Props) => {
    const [processing, setProcessing] = useState(initial<null>(false, null))
    return <Portal>
        <Dialog visible={visible} style={{ backgroundColor: lightPrimaryColor }}>
            <Dialog.Title><Text variant="titleLarge">{title}</Text></Dialog.Title>
            <Dialog.Content>
                <Text variant="bodyMedium">{question}</Text>
                { processing.loading && <ActivityIndicator /> }
                <Portal>
                    <ErrorSnackbar testID="confirmProcessingError" message={processing.error ? processing.error.message : undefined} onDismissError={() => setProcessing(initial(false, null))} />
                </Portal>
            </Dialog.Content>
            <Dialog.Actions>
                <IconButton size={15} iconColor="#000" icon={ p => <Images.Check fill={p.color}/> } onPress={async () => {
                    setProcessing(beginOperation())
                    try {
                        await onResponse(true)
                        setProcessing(fromData(null))
                    } catch(e) {
                        setProcessing(fromError(e, t('requestError')))
                    }
                } }/>
                <IconButton size={15} icon={p => <Images.Cross fill={p.color} />} iconColor={primaryColor} onPress={async () => { onResponse(false) } }/>
            </Dialog.Actions>
        </Dialog>
    </Portal>
}

export default ConfirmDialog