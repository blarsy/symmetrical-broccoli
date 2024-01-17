import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { t } from "i18next";
import React from "react";
import { View } from "react-native";
import { Button, Icon } from "react-native-paper";
import { primaryColor } from "./constants";

interface SimpleBackHeaderProps extends NativeStackHeaderProps {
    goBack? : () => void
}

const SimpleBackHeader = (props: SimpleBackHeaderProps) => <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
    <Button textColor={primaryColor} icon={p => <Icon size={p.size} source="chevron-left" color={p.color} /> }
        onPress={() => props.goBack ? props.goBack() : props.navigation.goBack() }>{t('back_label')}</Button>
</View>

export default SimpleBackHeader