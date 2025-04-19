import { t } from "@/i18n"
import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import React, { ReactNode, useState } from "react"
import { ActivityIndicator, Dialog, IconButton, Portal, Text } from "react-native-paper"
import { lightPrimaryColor, primaryColor } from "./layout/constants"
import Images from "@/Images"
import { OrangeButton } from "./layout/lib"
import { StyleProp, View, ViewStyle } from "react-native"
import { ErrorSnackbar } from "./OperationFeedback"
import BareIconButton from "./layout/BareIconButton"


interface ThemedDialogProps {
    visible: boolean
    content: ReactNode
    title?: string
    actions?: ReactNode[]
    testID?: string
    onDismiss: () => void
    actionZoneStyle?: StyleProp<ViewStyle>
    style?: StyleProp<ViewStyle>
    contentStyle?: StyleProp<ViewStyle>
}

export const ThemedDialog = ({ visible, content, title, actions, testID, onDismiss, actionZoneStyle, style, contentStyle }: ThemedDialogProps) => {
    return <Portal>
        <Dialog testID={testID} visible={visible} style={{ backgroundColor: lightPrimaryColor, ...(style as object) }} onDismiss={onDismiss}>
            <View style={{ flexDirection: 'row', paddingLeft: 16, paddingRight: 16, justifyContent: 'space-between' }}>
                <Text variant="titleLarge" style={{ textAlign:'center', flex: 1 }}>{title || ''}</Text>
                <BareIconButton size={20} Image={Images.Cross} onPress={onDismiss}/>
            </View>
            <Dialog.Content style={contentStyle}>
                {content}
            </Dialog.Content>
            { actions && <Dialog.Actions style={actionZoneStyle}>
                {actions}
            </Dialog.Actions>}
        </Dialog>
    </Portal>
}

interface InfoDialogProps {
    visible: boolean
    content: ReactNode
    title: string
    testID?: string
    onDismiss: () => void
    buttonCaptionI18n?: string
}

export const InfoDialog = ({ visible, content, title, testID, onDismiss, buttonCaptionI18n }: InfoDialogProps) => 
    <ThemedDialog onDismiss={onDismiss} title={title} testID={testID} visible={visible}
        actions={[<OrangeButton key="1" onPress={onDismiss}>{t(buttonCaptionI18n || 'understood')}</OrangeButton>]} 
        content={content} actionZoneStyle={{ justifyContent: 'center' }}/>

interface Props {
    visible: boolean
    onResponse: (confirmed: Boolean) => Promise<void>
    title: string
    question?: string
    content?: ReactNode
    testID?: string
    onDismiss: () => void
}

const ConfirmDialog = ({ visible, onResponse, title, question, content, testID, onDismiss }: Props) => {
    const [processing, setProcessing] = useState(initial<null>(false, null))

    return <ThemedDialog onDismiss={onDismiss} content={
        <>
            {content || <>
                <Text variant="bodyMedium">{question}</Text>
                { processing.loading && <ActivityIndicator color={primaryColor} /> }
            </> }
            <ErrorSnackbar onDismissError={() => {}} error={processing.error} message={t('requestError')} testID="SwitchToContriubtionModeError"/>
        </>} title={title} visible={visible} testID={testID}
        actions={[
            <IconButton key="yes" testID={`${testID}:YesButton`} size={15} iconColor="#000" icon={ p => <Images.Check fill={p.color}/> } onPress={async () => {
                setProcessing(beginOperation())
                try {
                    await onResponse(true)
                    setProcessing(fromData(null))
                } catch(e) {
                    setProcessing(fromError(e))
                }
            } }/>,
            <IconButton key="no" testID={`${testID}:NoButton`} size={15} icon={p => <Images.Cross fill={p.color} />} iconColor={primaryColor} onPress={async () => { onResponse(false) } }/>
        ]} />
    }
    
    export default ConfirmDialog