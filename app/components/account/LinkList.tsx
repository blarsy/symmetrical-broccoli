import { Link, getIconForLink } from "@/lib/schema"
import React from "react"
import { Linking, View } from "react-native"
import ListOf from "../ListOf"
import { Button, Text } from "react-native-paper"
import { primaryColor } from "../layout/constants"

interface Props {
    values: Link[]
}

export default ({ values }: Props) => <View style={{ alignItems: 'flex-start' }}>
    <ListOf data={values} displayItem={(link, idx) => <Button key={idx} mode="text" labelStyle={{ color: primaryColor }} icon={getIconForLink(link.type)} onPress={() => Linking.openURL(link.url)}>
        <Text style={{ textDecorationLine: 'underline' }}>{link.label || link.url}</Text>
    </Button>} />
</View>
