import React, { LegacyRef, PropsWithChildren, ReactNode, RefObject, useState } from "react"
import { Button, ButtonProps, Icon, Text, TextInput, TextInputProps, TextProps, Tooltip } from "react-native-paper"
import { lightPrimaryColor, primaryColor } from "./constants"
import { DatePickerModal } from "react-native-paper-dates"
import { ColorValue, Platform, StyleProp, TextStyle, View, ViewStyle } from "react-native"
import dayjs from "dayjs"
import { t } from "@/i18n"
import OptionSelect from "../OptionSelect"
import { VariantProp } from "react-native-paper/lib/typescript/components/Typography/types"
import { TouchableOpacity } from "react-native-gesture-handler"
import { aboveMdWidth, getLanguage, SMALL_IMAGEBUTTON_SIZE } from "@/lib/utils"
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

export const SubmitButton = (props: SubmitButtonProps) => <View style={{ marginTop: 10, marginBottom: 10, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }}>
{ props.submitCount > 0 && !props.isValid && <props.ErrorTextComponent>{t('someDataInvalid')}</props.ErrorTextComponent> }
    <props.Component disabled={props.updating} onPress={e => props.handleSubmit()} loading={props.updating} {...props}>
        {t('save_label')}
    </props.Component>
</View>

export const WhiteButton = (props: ButtonProps) => <Button mode="contained" textColor="#000" buttonColor={lightPrimaryColor}
    {...props} style={mergeWith({ borderRadius: 15 } , props.style )}/>
    
export const OrangeButton = (props: ButtonProps) => <Button mode="contained" textColor="#fff" buttonColor={primaryColor}
    {...props} style={mergeWith({ borderRadius: 15, padding: 10 } , props.style )} />
    
export const ErrorText= (props: PropsWithChildren) => {
    return <Text variant="bodyMedium" style={{ color: 'red' }}>{props.children}</Text>
}

export const OrangeBackedErrorText = (props: PropsWithChildren) => <Text variant="bodyMedium" style={{
    backgroundColor: 'orange', color: '#fff'
}}>{props.children}</Text>

interface StyledLabelProps {
    label: string
    color?: ColorValue
    variant?: VariantProp<never> | undefined
    isMandatory?: boolean
    style?: StyleProp<TextStyle>
}

export const StyledLabel = ({ label, color, variant, isMandatory, style }: StyledLabelProps) => 
    <Text variant={variant || 'labelSmall'} style={{ color, ...(style as object) }}>
        {label} {isMandatory && <Icon source="asterisk" size={20} color={color?.toString()}/>}
    </Text>


interface TextInputWithRefProps extends TextInputProps {
    innerRef?: RefObject<TextInput> | null
}

export const OrangeTextInput = (props: TextInputWithRefProps) => <TextInput 
    underlineColor="#fff"
    activeUnderlineColor="#fff"
    {...props}
    theme={{ colors: { onSurfaceVariant: '#ddd'} }}
    placeholderTextColor="#ddd" mode="flat" textColor="#fff" selectionColor="#fff"
    contentStyle={{ color: '#fff' }} style={Object.assign({
        backgroundColor: primaryColor,
        marginTop: 10,
    }, props.style)}
    ref={props.innerRef} />

interface TransparentTextInput extends TextInputProps {
    inlineMode?: boolean
    disableEmojis? : boolean
}

interface WhiteReadOnlyFieldProps {
    label: string
    value: string | ReactNode
    style?: StyleProp<ViewStyle>
    testID?: string
}

export const WhiteReadOnlyField = (p: WhiteReadOnlyFieldProps) => <View style={{ paddingTop: 22, paddingLeft: 16, paddingBottom: 4, paddingRight: 16, ...(p.style as object) }}>
    <StyledLabel label={p.label} color="#ffa38b"/>
    { typeof p.value === 'string' ?
        <Text testID={p.testID} variant="bodyMedium" style={{ color: '#fff' }}>{p.value}</Text>
        :
        p.value
    }
</View>

export const TransparentTextInput = (props: TransparentTextInput) => {
    return <TextInput keyboardType={props.disableEmojis ? Platform.OS == 'ios' ? "ascii-capable": "visible-password" : undefined } dense={props.inlineMode}
        placeholderTextColor="#222" mode="flat" textColor="#000" underlineColor={ props.inlineMode ? 'transparent' : "#222" }
        activeUnderlineColor={ props.inlineMode ? 'transparent' : "#222" } outlineColor={lightPrimaryColor} selectionColor="transparent"
        theme={{ colors: { onSurfaceVariant: '#222'} }}
        contentStyle={{
            color: '#000',
            padding: props.inlineMode ? 0 : undefined
        }} 
        {...props}
        style={{
            backgroundColor: 'transparent',
            marginTop: 10,
            ...(props.style as object)}}
        />
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
    testID?: string
    isMandatory?: boolean
}

export const CheckboxGroup = (props: CheckboxGroupProps) => <View style={{ flexDirection: 'column', alignContent: 'center', marginTop: 5 }}>
    { props.title && <StyledLabel style={{ marginLeft: 16 }} color={props.color} isMandatory={props.isMandatory} label={props.title}/> }
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        { Object.entries(props.options).map((p, idx) => <OptionSelect testID={`${props.testID}:${p[0]}`} selectedColor={props.selectedColor} color={props.color} key={idx} title={p[1]} value={props.values[p[0]]} onChange={newValue => {
            const oldValues = {...props.values}
            props.values[p[0]] = newValue
            props.onChanged(props.values, oldValues)
        }}/>) }
    </View>
</View>

interface RightAlignedModifyButtonsProps {
    editing: boolean
    onEditRequested: () => void
    saveButtonDisabled: boolean
    saveButtonColor?: ColorValue
    onSave: () => void
    onDelete?: () => void
    onCancelEdit?: () => void
    testID?: string
}

export const RightAlignedModifyButtons = (p: RightAlignedModifyButtonsProps) => <View style={{ position: 'absolute', flexDirection: 'row', right: 0, bottom: 5, gap: 3 }}>
    { !p.editing && <BareIconButton testID={`${p.testID}:Modify`} Image={Images.ModifyInCircle} size={SMALL_IMAGEBUTTON_SIZE} color="#000" 
        onPress={p.onEditRequested}/> }
    { p.editing && <BareIconButton testID={`${p.testID}:Save`} disabled={p.saveButtonDisabled} Image={Images.Check} size={SMALL_IMAGEBUTTON_SIZE} 
        color={p.saveButtonColor || '#000'} onPress={p.onSave}/> }
    { ((p.onDelete && !p.editing) || p.editing) && <BareIconButton Image={Images.Remove} size={SMALL_IMAGEBUTTON_SIZE} 
                                                    color={lightPrimaryColor} 
                                                    onPress={() => {
                                                        if(p.editing && p.onCancelEdit) {
                                                            p.onCancelEdit()
                                                        } else {
                                                            p.onDelete!()
                                                        }
                                                    }} />}
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
        <DatePickerModal
            testID={`${props.testID}:Picker`}
            locale={getLanguage()}
            saveLabel={t('selectButtonCaption')}
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

export const InfoIcon = ({ text }: { text: string }) => <Tooltip enterTouchDelay={1} title={text}>
    <Icon source="help-circle" size={20} />
</Tooltip>