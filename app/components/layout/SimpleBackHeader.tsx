import { NativeStackHeaderProps } from "@react-navigation/native-stack";
import { t } from "i18next";
import React from "react";
import { View } from "react-native";
import { Button, Icon } from "react-native-paper";
import { primaryColor } from "./constants";
import Images from "@/Images";

interface SimpleBackHeaderProps extends NativeStackHeaderProps {
    goBack? : () => void
}

const SimpleBackHeader = (props: SimpleBackHeaderProps) => <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
    <Button testID="BackButton" textColor={primaryColor} icon={p => <Images.Caret fill={p.color} width={p.size} height={p.size} />}
        onPress={() => props.goBack ? props.goBack() : props.navigation.goBack() }>{t('back_label').toUpperCase()}</Button>
</View>

export default SimpleBackHeader