import { Resource } from "i18next"
import React from "react"
import { Text } from "react-native-paper"

interface Props {
    resource?: Resource
    onChange: () => void
}

export default ({ resource, onChange }:Props) => <Text>Edit resource</Text>