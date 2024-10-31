import React from "react"
import { IconButton, Modal, Portal } from "react-native-paper"

import Login from "./mainViews/Login"
import { primaryColor } from "./layout/constants"
import Images from "@/Images"

interface Props {
    visible: boolean
    onDone?: () => void
    infoTextI18n?: string
    infoSubtextI18n?: string
    onCloseRequested: () => void
}

const ConnectionDialog = ({ visible, onDone, infoTextI18n, infoSubtextI18n, onCloseRequested }: Props) => <Portal>
    <Modal visible={visible} contentContainerStyle={{ shadowColor: primaryColor }} style={{ backgroundColor: primaryColor, margin: 5, borderRadius: 20, display: 'flex', justifyContent: 'space-around', flexDirection: 'column' }}>
        <IconButton size={15} icon={p => <Images.Cross fill={p.color} />} style={{ alignSelf: 'flex-end' }} onPress={() => {
            onCloseRequested()
            onDone && onDone()
        }} iconColor="#000"/>
        <Login onDone={onDone} infoTextI18n={infoTextI18n} infoSubtextI18n={infoSubtextI18n} />
    </Modal>
</Portal>

export default ConnectionDialog