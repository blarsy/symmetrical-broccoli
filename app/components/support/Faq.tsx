import { t } from "@/i18n";
import { linksUrl } from "@/lib/settings";
import React from "react";
import { Linking, View } from "react-native";
import { Button, Text } from "react-native-paper";

export default () => <View>
    <Text variant="headlineLarge" style={{ textAlign: 'center' }}>{t('faq_title')}</Text>
    <Text variant="bodyMedium" style={{ paddingVertical: 10 }}>{t('faq_explainer')}</Text>
    <Button icon="link" mode="outlined" textColor="#000" style={{ marginVertical: 10 }}
        onPress={() => Linking.openURL(`${linksUrl}2`)}><Text style={{ textDecorationLine: 'underline' }}>{t('faq_button_label')}</Text></Button>
</View>