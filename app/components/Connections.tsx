import { Account } from "@/lib/schema"
import React from "react"
import { Divider, IconButton, Text } from "react-native-paper"
import ListOf from "./ListOf"
import { View } from "react-native"

interface Props {
    data: Account[]
}

const Connections = ({ data }: Props) => <ListOf data={data} displayItem={(item, idx) => <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomColor: '#000', borderRadius: 0.01, borderStyle: 'dashed', borderBottomWidth: idx < data.length - 1 ? 1 : 0  }}>
        <Text>{item.name}</Text>
        <IconButton style={{ width: 24, height: 24, margin: 0 }} iconColor="#000" icon={{ uri: require('/assets/CROSS.svg')}} size={20} onPress={() => {}} />
    </View>} />

export default Connections