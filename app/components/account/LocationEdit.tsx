import React, { useEffect, useState } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { IconButton, Text } from "react-native-paper"
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { t } from "@/i18n"
import { adaptToWidth, DEFAUT_LOCATION, regionFromLocation, SMALL_IMAGEBUTTON_SIZE } from "@/lib/utils"
import 'react-native-get-random-values'
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { Location } from "@/lib/schema"
import ConfirmDialog from "../ConfirmDialog"
import Images from "@/Images"
import BareIconButton from "../layout/BareIconButton"
import EditAddressModal from "./EditAddressModal"
import { StyledLabel } from "../layout/lib"

interface Props {
    location: Location | null
    style?: StyleProp<ViewStyle>
    onLocationChanged: (newLocation: Location) => void
    onDeleteRequested: () => void
    orangeBackground?: boolean
    small?: boolean
    testID: string
    isMandatory?: boolean
}

export default ({ location, style, onLocationChanged, onDeleteRequested, orangeBackground, small, testID, isMandatory }: Props) => {
    const [editedLocation, setEditedLocation] = useState<Location | undefined>(undefined)
    const [currentLocation, setCurrentLocation] = useState<Location | null>(location)
    const [deleteRequested, setDeleteRequested] = useState(false)

    useEffect(() => {
        setCurrentLocation(location)
    }, [location])

    const color = orangeBackground ? '#fff' : '#000'

    return <View style={{ gap: 20, alignContent: 'stretch', ...(style as object)}}>
            <StyledLabel isMandatory={isMandatory} label={t('addressLabel')}/>
        { currentLocation ?
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text testID={`${testID}:address`} variant="headlineSmall" lineBreakMode="tail" numberOfLines={2} style={{ color, flexShrink: 1 }}>{currentLocation.address}</Text>
                <View style={{ flexDirection: 'row', gap: 3}}>
                    <BareIconButton size={SMALL_IMAGEBUTTON_SIZE} color="#000" Image={Images.ModifyInCircle}
                        onPress={() => { setEditedLocation(currentLocation || DEFAUT_LOCATION)}} />
                    <BareIconButton size={SMALL_IMAGEBUTTON_SIZE} color={orangeBackground ? lightPrimaryColor : primaryColor} Image={Images.Remove}
                        onPress={() => { setDeleteRequested(true)}} />
                </View>
            </View>
        :
            <View style={{ alignItems: 'center' }}>
                <Text variant="headlineSmall" style={{ color }}>{t('no_address_defined')}</Text>
                <IconButton testID={`${testID}:setAddress`} icon="map-marker-plus" size={50} containerColor="#fff" iconColor="#000" onPress={() => setEditedLocation(DEFAUT_LOCATION)}/>
            </View>
        }
        { currentLocation && !small && <MapView region={regionFromLocation(currentLocation)} scrollEnabled={false} 
            zoomEnabled={false} style={{ flex: 1, height: adaptToWidth(200, 300, 550) }} provider={PROVIDER_GOOGLE}>
            <Marker coordinate={{latitude: currentLocation.latitude, longitude: currentLocation.longitude}}/>
        </MapView>}
        <EditAddressModal visible={!!editedLocation} onDone={newLocation => {
            if(newLocation) {
                onLocationChanged(newLocation)
                setCurrentLocation(newLocation)
            }
            setEditedLocation(undefined)
        }}/>
        <ConfirmDialog question={t('confirmation_unlink_account_location')} title={t('Confirmation_DialogTitle')}
            visible={deleteRequested} onResponse={async confirmed => {
                if(confirmed) {
                    onDeleteRequested()
                }
                setDeleteRequested(false)
            }} onDismiss={() => setDeleteRequested(false)} />
    </View>
}