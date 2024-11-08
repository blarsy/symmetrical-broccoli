import React, { useEffect, useRef, useState } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { IconButton, Modal, Portal, Text, TextInput, useTheme } from "react-native-paper"
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps'
import { language, t } from "@/i18n"
import { adaptToWidth, regionFromLocation } from "@/lib/utils"
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteRef } from 'react-native-google-places-autocomplete'
import { lightPrimaryColor } from "../layout/constants"
import { googleMapsApiKey } from "@/lib/settings"
import Geocoder from 'react-native-geocoding'
import { OrangeButton } from "../layout/lib"
import { Location } from "@/lib/schema"
import ConfirmDialog from "../ConfirmDialog"
import Images from "@/Images"

const DEFAUT_LOCATION: Location = {
    latitude: 50.60953016033429,
    longitude: 3.3852031850513713,
    address: ''
}

interface EditAddressModalProps {
    visible: boolean
    onDone: (newLocation: Location | undefined) => void
}

const EditAddressModal = ({ visible, onDone }: EditAddressModalProps) => {
    const [currentLocation, setCurrentLocation] = useState<Location | undefined>(undefined)
    
    useEffect(() => {
        setCurrentLocation(currentLocation)
    }, [currentLocation])
    
    return <Portal>
        <Modal dismissable visible={visible} onDismiss={() => onDone(undefined)} 
            contentContainerStyle={{ display: 'flex', flexDirection: 'column', padding: 20,
                    backgroundColor: lightPrimaryColor, margin: 10, borderRadius: 15, gap: 10 }}>
                <Text variant="headlineLarge" style={{ textAlign: 'center', paddingVertical: 10, 
                    borderBottomColor: '#000', borderBottomWidth: 1, fontSize: 24 }}>{t('setLocation_dialog_title')}</Text>
                <GooglePlacesAutocomplete styles={{ container: { flex: 1, flexBasis: 50 }, listView: { position: 'absolute', zIndex: 9999, top: 40 } }} placeholder={t('type_address_prompt')} query={{
                    key: googleMapsApiKey,
                    language,
                }} onPress={async (data) => {
                    Geocoder.init(googleMapsApiKey, { language })
                    const res = await Geocoder.from(data.description)
                    
                    setCurrentLocation({ 
                        address: data.description,
                        latitude: res.results[0].geometry.location.lat,
                        longitude: res.results[0].geometry.location.lng
                     })
                }} autoFillOnNotFound textInputProps={{ InputComp: TextInput }} fetchDetails={false} debounce={700} />
                <MapView showsUserLocation={false} style={{ flex: 1, flexBasis: 300, opacity: currentLocation ? 1 : 0.1 }} 
                    region={regionFromLocation(currentLocation || DEFAUT_LOCATION)}
                    provider={PROVIDER_GOOGLE}>
                    <Marker coordinate={currentLocation || DEFAUT_LOCATION} draggable onDragEnd={e => setCurrentLocation({
                        address: (currentLocation || DEFAUT_LOCATION).address, 
                        latitude: e.nativeEvent.coordinate.latitude,
                        longitude: e.nativeEvent.coordinate.longitude
                    })}/>
                </MapView>
                <Text variant="bodySmall">{t('adjust_pin_instructions')}</Text>
                <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                    <OrangeButton onPress={() => onDone(undefined)}>{t('close_buttonCaption')}</OrangeButton>
                    <OrangeButton onPress={() => {
                        onDone(currentLocation)
                    }}>{t('done_buttonCaption')}</OrangeButton>
                </View>
        </Modal>
    </Portal>
} 
    
interface Props {
    location?: Location
    style?: StyleProp<ViewStyle>
    onLocationChanged: (newLocation: Location) => void
    onDeleteRequested: () => void
    orangeBackground?: boolean
    small?: boolean
}

export default ({ location, style, onLocationChanged, onDeleteRequested, orangeBackground, small }: Props) => {
    const [editedLocation, setEditedLocation] = useState<Location | undefined>(undefined)
    const [currentLocation, setCurrentLocation] = useState<Location | undefined>(location)
    const [deleteRequested, setDeleteRequested] = useState(false)

    useEffect(() => {
        setCurrentLocation(location)
    }, [location])

    const color = orangeBackground ? '#fff' : '#000'
    const iconButtonMode = orangeBackground ? 'contained' : 'outlined'

    return <View style={{ gap: 20, alignContent: 'stretch', ...(style as object)}}>
        { currentLocation ?
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text variant="headlineSmall" lineBreakMode="tail" numberOfLines={2} style={{ color, flexShrink: 1 }}>{currentLocation.address}</Text>
                <View style={{ flexDirection: 'row' }}>
                    <IconButton size={25} mode={iconButtonMode} containerColor="#fff" iconColor="#000" icon="pencil" 
                        onPress={() => { setEditedLocation(currentLocation || DEFAUT_LOCATION)}} />
                    <IconButton size={25} mode={iconButtonMode} containerColor="#fff" iconColor="#000" icon={p => <Images.Bin style={{ width: 25, height: 25 }} fill={p.color} />}
                        onPress={() => { setDeleteRequested(true)}} />
                </View>
            </View>
        :
            <View style={{ alignItems: 'center' }}>
                <Text variant="headlineSmall" style={{ color }}>{t('no_address_defined')}</Text>
                <IconButton icon="map-marker-plus" size={50} containerColor="#fff" iconColor="#000" onPress={() => setEditedLocation(DEFAUT_LOCATION)}/>
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
            }} />
    </View>
}