import Images from "@/Images";
import { t } from "@/i18n";
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

export default () => (<View style={{ alignItems: 'center', padding: 20 }}>
    <Text variant="bodyMedium" style={{ textAlign: 'center', paddingBottom: 20 }}>{t('noConversationLoaded_label')}</Text>
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
        <Text variant="labelLarge">{t('look_for_me1')}</Text>
        <Images.Chat height={35} width={35} />
        <Text variant="labelLarge">{t('look_for_me2')}</Text>
    </View>
</View>)