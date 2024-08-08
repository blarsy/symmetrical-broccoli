import React from "react"
import { ScrollView } from "react-native-gesture-handler"

enum TextRunType {
    text,
    link
}

interface NotificationData {
    read: boolean
    text: { type: TextRunType, content: string }[]
    image?: string
}

export default () => <ScrollView>

</ScrollView>