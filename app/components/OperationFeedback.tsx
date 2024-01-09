import { ApolloError } from "@apollo/client"
import { t } from "i18next"
import React from "react"
import { Text } from "react-native"
import { Portal, Snackbar, Icon } from "react-native-paper"

interface Props {
    error: ApolloError | undefined
    success?: boolean
    successMessage?: string
    onDismissError: () => void
    onDismissSuccess?: () => void
}

interface ErrorSnackbarProps {
    message?: string
    onDismissError: () => void
}
const ErrorSnackbar = ({ message, onDismissError }: ErrorSnackbarProps) => <Snackbar style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'rgb(244, 199, 199)' }} visible={!!message} onDismiss={onDismissError}>
    <Text style={{ color: 'rgb(22, 11, 11)' }}><Icon source="close-circle-outline" size={20} /> {message}</Text>
</Snackbar>

interface SuccessSnackbarProps {
    message?: string
    onDismissSuccess: () => void
}
const SuccessSnackbar = ({ message, onDismissSuccess }: SuccessSnackbarProps) => <Snackbar style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: 'rgb(204, 232, 205)' }} visible={!!message} onDismiss={onDismissSuccess}>
    <Text style={{ color: 'rgb(12, 19, 13)' }}> <Icon source="check-circle-outline" size={20} /> {message}</Text>
</Snackbar>

const OperationFeedback = ({ error, success, successMessage, onDismissError, onDismissSuccess }: Props) => {
    return <Portal>
        <ErrorSnackbar message={error && error.message} onDismissError={onDismissError} />
        { success && onDismissSuccess && <SuccessSnackbar message={successMessage || t('success_message')} onDismissSuccess={onDismissSuccess} /> }
    </Portal>
}

export default OperationFeedback