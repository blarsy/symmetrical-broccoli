import { Location } from "@/lib/schema"
import { DEFAUT_LOCATION } from "@/lib/utils"
import React from "react"
import { Button, Text } from "react-native-paper"

interface EditAddressModalProps {
    visible: boolean
    onDone: (newLocation: Location | undefined) => void
}

const EditAddressModal = ({ visible, onDone }: EditAddressModalProps) => {
    return visible && <Button testID="MockEditAddressModalButton" onPress={() => onDone({ address: 'Dummy address', latitude: DEFAUT_LOCATION.latitude, longitude: DEFAUT_LOCATION.longitude })}>Done</Button>
} 

export default EditAddressModal