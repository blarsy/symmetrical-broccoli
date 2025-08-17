import { language } from "@/i18n"
import { Location } from "@/lib/schema"
import { googleMapsApiKey } from "@/lib/settings"
import { DEFAUT_LOCATION, regionFromLocation } from "@/lib/utils"
import { t } from "i18next"
import React, { useState, useEffect } from "react"
import { View } from "react-native"
import { GooglePlacesAutocomplete, GooglePlacesAutocompleteProps } from "react-native-google-places-autocomplete"
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"
import { Modal, Portal, Text, TextInput } from "react-native-paper"
import { lightPrimaryColor } from "../layout/constants"
import { OrangeButton } from "../layout/lib"
import Geocoder from 'react-native-geocoding'

interface EditAddressModalProps {
    visible: boolean
    onDone: (newLocation: Location | undefined) => void
}

const defaultProps: GooglePlacesAutocompleteProps = {
  autoFillOnNotFound: false,
  currentLocation: false,
  currentLocationLabel: 'Current location',
  debounce: 0,
  disableScroll: false,
  enableHighAccuracyLocation: true,
  enablePoweredByContainer: true,
  fetchDetails: false,
  fields: '*',
  filterReverseGeocodingByTypes: [],
  GooglePlacesDetailsQuery: {},
  GooglePlacesSearchQuery: {
    rankby: 'distance',
    type: 'restaurant',
  },
  GoogleReverseGeocodingQuery: {},
  isNewPlacesAPI: false,
  isRowScrollable: true,
  keepResultsAfterBlur: false,
  keyboardShouldPersistTaps: 'always',
  listHoverColor: '#ececec',
  listUnderlayColor: '#c8c7cc',
  listViewDisplayed: 'auto',
  minLength: 0,
  nearbyPlacesAPI: 'GooglePlacesSearch',
  numberOfLines: 1,
  onFail: () => {},
  onNotFound: () => {},
  onPress: () => {},
  // eslint-disable-next-line no-console
  onTimeout: () => console.warn('google places autocomplete: request timeout'),
  placeholder: '',
  predefinedPlaces: [],
  predefinedPlacesAlwaysVisible: false,
  query: {
    key: 'missing api key',
    language: 'en',
    type: 'geocode',
  },
  styles: {},
  suppressDefaultStyles: false,
  textInputHide: false,
  textInputProps: {},
  timeout: 20000,
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
            <GooglePlacesAutocomplete {...defaultProps} styles={{ container: { flex: 1, flexBasis: 50 }, listView: { position: 'absolute', zIndex: 9999, top: 40 } }} 
                placeholder={t('type_address_prompt')} query={{
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
            }} textInputProps={{ InputComp: TextInput }} fetchDetails={false} debounce={700} />
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

export default EditAddressModal