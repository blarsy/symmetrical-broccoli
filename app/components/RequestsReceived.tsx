import { Account } from "@/lib/schema"
import React from "react"
import { IconButton, Text } from "react-native-paper"
import ListOf from "./ListOf"
import { View } from "react-native"

interface Props {
    data: Account[]
}

const RequestsReceived = ({ data }: Props) => <ListOf data={data} displayItem={(item, idx) => <View style={{ flex: 1, flexDirection: 'row', borderBottomColor: '#000', borderRadius: 0.01, borderStyle: 'dashed', borderBottomWidth: idx < data.length - 1 ? 1 : 0   }}>
    <Text>{item.name}</Text>
    <IconButton icon={{ uri: require('/assets/VALID.svg')}} size={16} onPress={() => {}} />
    <IconButton icon={{ uri: require('/assets/CROSS.svg')}} size={16} onPress={() => {}} />
</View>} />

export default RequestsReceived