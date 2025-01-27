import React, { useState } from "react"
import { Button, ButtonProps, Icon, Text, TextInput, TextInputProps, TextProps } from "react-native-paper"
import { lightPrimaryColor, primaryColor } from "./constants"
import { DatePickerModal } from "react-native-paper-dates"
import { ColorValue, Platform, View } from "react-native"
import dayjs from "dayjs"
import { t } from "@/i18n"
import OptionSelect from "../OptionSelect"
import { VariantProp } from "react-native-paper/lib/typescript/components/Typography/types"
import { TouchableOpacity } from "react-native-gesture-handler"
import { aboveMdWidth, getLanguage } from "@/lib/utils"
import BareIconButton from "./BareIconButton"
import Images from "@/Images"

const mergeWith = (a: object, b: any): object => {
    if(b && typeof b === 'object') {
        return { ...a, ...b }
    }
    return a
}

interface SubmitButtonProps extends ButtonProps {
    ErrorTextComponent: React.ComponentType<TextProps<never>>
    Component: React.ComponentType<ButtonProps>
    submitCount: number
    isValid: boolean
    updating: boolean
    handleSubmit: () => void
    testID: string
}

export const SubmitButton = (props: SubmitButtonProps) => <View style={{ marginTop: 20, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }}>
{ props.submitCount > 0 && !props.isValid && <props.ErrorTextComponent>{t('someDataInvalid')}</props.ErrorTextComponent> }
    <props.Component disabled={props.updating} onPress={e => props.handleSubmit()} loading={props.updating} {...props}>
        {t('save_label')}
    </props.Component>
</View>

export const WhiteButton = (props: ButtonProps) => <Button mode="contained" textColor="#000" buttonColor={lightPrimaryColor}
    {...props} style={mergeWith({ borderRadius: 15 } , props.style )}/>
    
export const OrangeButton = (props: ButtonProps) => <Button mode="contained" textColor="#fff" buttonColor={primaryColor}
    {...props} style={mergeWith({ borderRadius: 15, padding: 10 } , props.style )} />
    
export function ErrorText(props: TextProps<never>) {
    return <Text variant="bodyMedium" style={{ color: 'red' }}>{props.children}</Text>
}

export const OrangeBackedErrorText = (props: TextProps<never>) => <Text variant="bodyMedium" style={{
    backgroundColor: 'orange', color: '#fff'
}}>{props.children}</Text>

export const StyledLabel = ({ label, color, variant }: { label: string, color?: ColorValue, variant?: VariantProp<never> | undefined }) => <Text variant={variant || 'labelSmall'} style={{ color: color }}>{label}</Text>

export const OrangeTextInput = (props: TextInputProps) => <TextInput 
    {...props}
    placeholderTextColor="#ddd" mode="flat" textColor="#fff" underlineColor="#fff"
    activeUnderlineColor="#fff" selectionColor="#fff"
    theme={{ colors: { onSurfaceVariant: '#ddd'} }}
    contentStyle={{
        color: '#fff'
    }} style={Object.assign({
        backgroundColor: primaryColor,
        marginTop: 10,
    }, props.style)}/>

interface TransparentTextInput extends TextInputProps {
    inlineMode?: boolean
    disableEmojis? : boolean
}

export const TransparentTextInput = (props: TransparentTextInput) => {
    return <TextInput keyboardType={props.disableEmojis ? Platform.OS == 'ios' ? "ascii-capable": "visible-password" : undefined } dense={props.inlineMode}
        placeholderTextColor="#222" mode="flat" textColor="#000" underlineColor={ props.inlineMode ? 'transparent' : "#222" }
        activeUnderlineColor={ props.inlineMode ? 'transparent' : "#222" } outlineColor={lightPrimaryColor} selectionColor="transparent"
        theme={{ colors: { onSurfaceVariant: '#222'} }}
        contentStyle={{
            color: '#000',
            padding: props.inlineMode ? 0 : undefined
        }} 
        style={Object.assign({
            backgroundColor: 'transparent',
            marginTop: 10
        }, props.style)} 
        {...props}/>
}

interface CheckboxGroupProps {
    title: string
    options: {
        [name: string]: string
    }
    values: { [name: string]: boolean }
    onChanged: (values: { [name: string]: boolean }, oldValues: { [name: string]: boolean }) => void
    selectedColor?: ColorValue
    color?: ColorValue
    testID: string
}

export const CheckboxGroup = (props: CheckboxGroupProps) => <View style={{ flexDirection: 'column', alignContent: 'center', marginTop: 5 }}>
    { props.title && <Text variant="labelSmall" style={{ marginLeft: 16, color: props.color }}>{props.title}</Text> }
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        { Object.entries(props.options).map((p, idx) => <OptionSelect testID={`${props.testID}:${p[0]}`} selectedColor={props.selectedColor} color={props.color} key={idx} title={p[1]} value={props.values[p[0]]} onChange={newValue => {
            const oldValues = {...props.values}
            props.values[p[0]] = newValue
            props.onChanged(props.values, oldValues)
        }}/>) }
    </View>
</View>

interface DateTimePickerFieldProps {
    value?: Date
    onChange: (value: Date | undefined) => void
    label: string
    textColor?: ColorValue | undefined
    backgroundColor?: ColorValue | undefined
    testID: string
}

export const DateTimePickerField = (props: DateTimePickerFieldProps) => {
    const [dateOpen, setDateOpen] = useState(false)

    return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center', alignItems: 'center', marginTop: 5, paddingVertical: 10  }}>
            <Text variant="labelSmall" style={{ color: props.textColor, marginLeft: 16 }}>{props.label}</Text>
            { props.value && <BareIconButton Image={p => <Images.Cross fill="red"/>} color={primaryColor} size={20} onPress={e => {
                e.stopPropagation()
                props.onChange(undefined)
            }} />}
            <TouchableOpacity testID={`${props.testID}:Button`} style={{ flexDirection: 'row', justifyContent: 'space-between', alignContent: 'center', alignItems: 'center' }}
                onPress={() => setDateOpen(true)}>
                <Text variant="bodyMedium">{props.value ? dayjs(props.value).format(t('dateFormat')) : t('noDate')}</Text>
                <View style={{ marginRight: 14 }}>
                    <Icon source="chevron-right" size={26} color="#000" />
                </View>
            </TouchableOpacity>
            <DatePickerModal testID={`${props.testID}:Picker`}
                locale={getLanguage()}
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
        </View>
}


export const Hr = ({ color, thickness, margin }: { color?: ColorValue, thickness?: number, margin?: number }) => 
    <View style={{ backgroundColor: color || '#343434', 
        height: thickness || 1, transform: 'scaleY(0.5)', 
        marginVertical: margin || 5 }}></View>