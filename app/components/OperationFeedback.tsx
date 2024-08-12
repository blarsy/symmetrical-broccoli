import { t } from "i18next"
import React from "react"
import { View } from "react-native"
import { ActivityIndicator, Icon, Portal, Snackbar, Text, Tooltip } from "react-native-paper"

interface Props {
    error: Error | undefined
    success?: boolean
    successMessage?: string
    onDismissError: () => void
    onDismissSuccess?: () => void
}

interface ErrorSnackbarProps {
    message?: string
    error?: Error
    onDismissError: () => void
}
export const ErrorSnackbar = ({ message, error, onDismissError }: ErrorSnackbarProps) => <Snackbar 
    theme={{ colors: { inverseOnSurface: 'rgb(12, 19, 13)' } }}    
    icon="close" onIconPress={onDismissError} 
    style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', backgroundColor: 'rgb(244, 199, 199)' }} 
    visible={!!message} onDismiss={onDismissError}>
        <View style={{ display: 'flex', flexDirection: 'row', gap: 5, alignItems: 'center' }}>
            { error && <Tooltip title={error?.message}><Icon source="information" size={20}/></Tooltip>}
            <Text variant="bodySmall">{message}</Text>
        </View>
</Snackbar>

interface SuccessSnackbarProps {
    message?: string
    onDismissSuccess: () => void
}
export const SuccessSnackbar = ({ message, onDismissSuccess }: SuccessSnackbarProps) => <Snackbar 
    theme={{ colors: { inverseOnSurface: 'rgb(12, 19, 13)' } }} 
    icon="close" onIconPress={onDismissSuccess} 
    style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', backgroundColor: 'rgb(204, 232, 205)' }} 
    visible={!!message} onDismiss={onDismissSuccess}>
    <Text variant="bodySmall">{message}</Text>
</Snackbar>

export const InfoSnackbar = ({ message }: { message: string}) => <Snackbar
    theme={{ colors: { inverseOnSurface: 'rgb(12, 19, 13)' } }}
    style={{ backgroundColor: '#f0b91e' }}
    visible={!!message} onDismiss={() => {}}>
        <View style={{ flexDirection: 'row', alignItems:'center', gap: 15 }}>
            <Text variant="bodySmall" style={{ color: '#000' }}>{message}</Text>
            <ActivityIndicator color="#000" size="small" />
        </View>
</Snackbar>

const OperationFeedback = ({ error, success, successMessage, onDismissError, onDismissSuccess }: Props) => {
    return <Portal>
        <ErrorSnackbar error={error} message={error && t('requestError')} onDismissError={onDismissError} />
        { success && onDismissSuccess && <SuccessSnackbar message={successMessage || t('success_message')} onDismissSuccess={onDismissSuccess} /> }
    </Portal>
}

export default OperationFeedback