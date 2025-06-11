import { t } from "@/i18n";
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import InfoHowToGet from "./InfoHowToGet";

const InfoSuspension = ({ navigation }: { navigation: any }) => <View>
    <Text variant="displayMedium">{t('whySuspended')}</Text>
    <InfoHowToGet navigation={navigation} />
</View>

export default InfoSuspension