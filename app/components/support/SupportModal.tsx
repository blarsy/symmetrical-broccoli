import React, { useState } from "react"
import { Button, IconButton, Modal, Portal, Text } from "react-native-paper"
import { Dimensions, ScrollView, View } from "react-native"
import { lightPrimaryColor } from "../layout/constants"
import ReportIssue from "./ReportIssue"
import { t } from "@/i18n"
import Faq from "./Faq"
import { WhiteButton } from "../layout/lib"
import Images from "@/Images"

interface Props {
    visible: boolean
    onDismiss: () => void
}

const topics = [
    { title: t('bug_issue_title'), component: <ReportIssue/>, icon: "bug" },
    { title: t('faq_title'), component: <Faq/>, icon: "chat-question" }
]

export default ({ visible, onDismiss }: Props) => {
    const [selectedTopic, setSelectedTopic] = useState<number>(-1)
    return <Portal>
        <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ padding: 20, backgroundColor: lightPrimaryColor, margin: 10, borderRadius: 15, maxHeight: Dimensions.get('window').height - 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomColor: '#000', borderBottomWidth: 1, marginBottom: 10 }}>
                <IconButton icon={Images.Caret} size={12} style={{ opacity: selectedTopic != -1 ? 1 : 0 }} onPress={() => setSelectedTopic(-1)} />
                <Text variant="headlineLarge" style={{ textAlign: 'center', flex: 1, paddingVertical: 10, fontSize: 24 }}>{t('support_title')}</Text>
                <IconButton icon={Images.Cross} size={12} onPress={onDismiss} />
            </View>
            <ScrollView>
                { selectedTopic != -1 ? 
                    topics[selectedTopic].component
                : <View style={{ gap: 10 }}>
                    { topics.map((topic, idx) => <WhiteButton key={idx} icon={topic.icon} onPress={() => {
                        setSelectedTopic(idx)
                    }}>{topic.title}</WhiteButton> )}
                </View> }
            </ScrollView>
        </Modal>
    </Portal>
} 