import { t } from "@/i18n"
import { Category } from "@/lib/schema"
import { useContext, useState } from "react"
import LoadedZone from "../LoadedZone"
import React from "react"
import { TouchableOpacity, View } from "react-native"
import { Icon, Modal, Portal, Text, TextInput } from "react-native-paper"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { OrangeButton, StyledLabel, TransparentTextInput } from "../layout/lib"
import { VariantProp } from "react-native-paper/lib/typescript/components/Typography/types"
import { AppContext } from "../AppContextProvider"

interface CategoriesSelectModalProps {
    open: boolean
    setOpen: (newOpen: boolean) => void
    initialCategories: Category[]
    categories: Category[]
    onChange: (selectedCategories: Category[]) => void
    testID: string
}

const CategoriesSelectModal = ({ open, setOpen, initialCategories, categories, onChange, testID }: CategoriesSelectModalProps) => {
    const [selectedCategories, setSelectedCategories] = useState(initialCategories)
    return <Modal visible={open} onDismiss={() => setOpen(false)} contentContainerStyle={{ padding: 20, backgroundColor: lightPrimaryColor, margin: 10, borderRadius: 15 }}>
        <Text variant="headlineLarge" style={{ textAlign: 'center', paddingVertical: 10, fontSize: 24 }}>{t('resourceCategories_label')}</Text>
        <View style={{ paddingVertical: 25, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 5 }}>
            {categories.map(cat => {
                const isSelected = selectedCategories.some(selectedCat => selectedCat.code === cat.code )
                return <TouchableOpacity testID={ `${testID}:Category:${cat.code}` } onPress={() => {
                    if(isSelected) {
                        setSelectedCategories(selectedCategories.filter(selectedCat => selectedCat.code != cat.code))
                    } else {
                        setSelectedCategories([...selectedCategories, cat])
                    }
                }} key={cat.code}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Icon source={isSelected ? `checkbox-marked` : `checkbox-blank-outline`} color={isSelected ? primaryColor : '#000'} size={25}/>
                    <Text style={{ color: isSelected ? primaryColor : '#000', flex: 1, textAlign: 'center' }} variant="bodyLarge">{cat.name}</Text>
                </View>
            </TouchableOpacity>
            })}
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
            <OrangeButton onPress={() => setOpen(false)}>{t('close_buttonCaption')}</OrangeButton>
            <OrangeButton testID={ `${testID}:ConfirmButton` } onPress={() => {
                onChange(selectedCategories)
                setOpen(false)
            }}>{t('done_buttonCaption')}</OrangeButton>
        </View>
    </Modal>
}

interface Props {
    value: Category[]
    onChange: (categories: Category[])=> void
    label?: string
    labelVariant?: VariantProp<never> | undefined
    inline?: boolean
    testID: string
    isMandatory?: boolean
}

const CategoriesSelect = ({ value, onChange, labelVariant, label, inline, testID, isMandatory }: Props) => {
    const appContext = useContext(AppContext)
    const [ open, setOpen ] = useState(false)

    const openModal = () => setOpen(true)
    
    return <LoadedZone loading={appContext.categories.loading} error={appContext.categories.error}>
        { appContext.categories.data ? <View>
            <TouchableOpacity testID={ `${testID}:Button` } onPress={openModal}>
                <View style={{ display: 'flex', flexDirection: 'row' }}>
                    <TransparentTextInput inlineMode={inline} label={<StyledLabel isMandatory={isMandatory} variant={labelVariant} label={label || t('resourceCategories_label')} />} editable={false} 
                        value={( value.map(cat => cat.name).join(', '))} right={<TextInput.Icon color="#000" onPress={openModal} size={26} icon="chevron-right"/>} 
                        style={{ margin: 0, flex: 1, backgroundColor: 'transparent' }}/>
                </View>
            </TouchableOpacity>
            <Portal>
                <CategoriesSelectModal testID={ `${testID}:Modal` }  categories={appContext.categories.data} initialCategories={value} open={open} setOpen={setOpen}
                    onChange={onChange} />
            </Portal>
        </View> : <></> }
    </LoadedZone>

}

export default CategoriesSelect