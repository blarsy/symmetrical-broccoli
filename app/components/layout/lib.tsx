import React, { useState } from "react"
import { Button, ButtonProps, Text, TextInput, TextInputProps, TextProps } from "react-native-paper"
import { primaryColor } from "./constants"
import { DatePickerModal, TimePickerModal } from "react-native-paper-dates"
import { getLocales } from "expo-localization"
import { ColorValue, View } from "react-native"
import dayjs from "dayjs"
import { t } from "@/i18n"

export const WhiteButton = (props: ButtonProps) => <Button mode="contained" textColor="#000" buttonColor="#fff" 
    labelStyle={{ fontSize: 20 }} {...props} />
    
export const OrangeButton = (props: ButtonProps) => <Button mode="contained" textColor="#fff" buttonColor={primaryColor}
    labelStyle={{ fontSize: 20 }} {...props} />
    
export function ErrorText(props: TextProps<never>) {
    return <Text style={{ color: 'red' }}>{props.children}</Text>
}

export const OrangeBackedErrorText = (props: TextProps<never>) => <Text style={{
    backgroundColor: 'orange', color: '#fff'
}}>{props.children}</Text>

export const OrangeTextInput = (props: TextInputProps) => <TextInput 
    {...props}
    placeholderTextColor="#ddd" mode="flat" textColor="#fff" underlineColor="#fff"
    activeUnderlineColor="#fff" selectionColor="transparent"
    theme={{ colors: { onSurfaceVariant: '#ddd'} }}
    contentStyle={{
        color: '#fff',
        fontSize: 16
    }} style={Object.assign({
        backgroundColor: primaryColor,
        marginTop: 10,
    }, props.style)}/>

export const TransparentTextInput = (props: TextInputProps) => {
    return <TextInput 
        {...props}
        placeholderTextColor="#222" mode="flat" textColor="#000" underlineColor="#222"
        activeUnderlineColor="#222" selectionColor="transparent"
        theme={{ colors: { onSurfaceVariant: '#222'} }}
        contentStyle={{
            color: '#000',
            fontSize: 16
        }} style={Object.assign({
            backgroundColor: 'transparent',
            marginTop: 10,
        }, props.style)}/>
}

const lang = getLocales()[0].languageCode

interface DateTimePickerFieldProps {
    value?: Date
    onChange: (value: Date | undefined) => void
    label: string
    textColor?: ColorValue | undefined
    backgroundColor?: ColorValue | undefined
}

export const DateTimePickerField = (props: DateTimePickerFieldProps) => {
    const [timeOpen, setTimeOpen] = useState(false)
    const [dateOpen, setDateOpen] = useState(false)

    return <View style={{ flexDirection: 'column', justifyContent: 'space-between', alignContent: 'center', marginTop: 5 }}>
        <Text style={{ color: props.textColor, fontSize: 16, marginLeft: 16 }}>{props.label}</Text>
        <View style={{ flexDirection: 'row', alignSelf: 'center' }}>
            <Button icon="calendar" mode="outlined" style={{ borderRadius: 0, borderColor: props.textColor, backgroundColor: props.backgroundColor }} onPress={() => setDateOpen(true)} labelStyle={{ fontSize: 16, margin: 10, marginLeft: 20, color: props.textColor }}>
                {props.value ? dayjs(props.value).format(t('dateFormat')) : t('noDate')}
            </Button>
            { props.value && <Button icon="clock" mode="outlined" style={{ borderRadius: 0, borderColor: props.textColor, backgroundColor: props.backgroundColor }} onPress={() => setTimeOpen(true)} labelStyle={{ fontSize: 16, margin: 10, marginLeft: 20, color: props.textColor }}>
                {props.value ? `${props.value.getHours().toString().padStart(2, '0')}:${props.value.getMinutes().toString().padStart(2, '0')}` : ''}
            </Button>}
        </View>
        <DatePickerModal
            locale={lang}
            mode="single"
            visible={dateOpen}
            onDismiss={() => setDateOpen(false)}
            date={props.value}
            onConfirm={val => {
                if(val.date && props.value) {
                    val.date.setHours(props.value.getHours())
                    val.date.setMinutes(props.value.getMinutes())
                }
                props.onChange(val.date)
                setDateOpen(false)
            }}
        />
        <TimePickerModal locale={lang} visible={timeOpen} onConfirm={val => {
            let date = new Date()
            if(props.value) {
                date = props.value
            }
            date.setHours(val.hours)
            date.setMinutes(val.minutes)
            setTimeOpen(false)
            props.onChange(date)
        }} onDismiss={() => setTimeOpen(false)} />
    </View>
}