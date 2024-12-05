import React from "react"
import { Card, Text } from "react-native-paper"
import { lightPrimaryColor } from "../layout/constants"

const History = () => {
    return <Card style={{ backgroundColor: lightPrimaryColor, margin: 10, padding: 10 }}>
        <Text>Token history</Text>
    </Card>
}

export default History