import { t } from "@/i18n";
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";
import InfoHowToGet from "./InfoHowToGet";

const InfoSuspension = () => <View>
    <Text variant="displayMedium">{t('whySuspended')}</Text>
    <InfoHowToGet />
</View>

export default InfoSuspension