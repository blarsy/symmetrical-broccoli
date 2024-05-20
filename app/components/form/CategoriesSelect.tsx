import { t } from "@/i18n"
import { Category } from "@/lib/schema"
import { useContext, useState } from "react"
import LoadedZone from "../LoadedZone"
import React from "react"
import { TouchableOpacity, View } from "react-native"
import { Modal, Portal, Text, TextInput } from "react-native-paper"
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
}

const CategoriesSelectModal = ({ open, setOpen, initialCategories, categories, onChange }: CategoriesSelectModalProps) => {
    const [selectedCategories, setSelectedCategories] = useState(initialCategories)
    return <Modal visible={open} onDismiss={() => setOpen(false)} contentContainerStyle={{ padding: 20, backgroundColor: lightPrimaryColor, margin: 10, borderRadius: 15 }}>
        <Text variant="headlineLarge" style={{ textAlign: 'center', paddingVertical: 10, borderBottomColor: '#000', borderBottomWidth: 1, fontSize: 24 }}>{t('resourceCategories_label')}</Text>
        <View style={{ paddingVertical: 25, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
            {categories.map(cat => <TouchableOpacity onPress={() => {
                    if(selectedCategories.some(selectedCat => selectedCat.code === cat.code )) {
                        setSelectedCategories(selectedCategories.filter(selectedCat => selectedCat.code != cat.code))
                    } else {
                        setSelectedCategories([...selectedCategories, cat])
                    }
                }} key={cat.code}>
                <Text style={{ color: selectedCategories.some(selectedCat => selectedCat.code === cat.code ) ? primaryColor : '#000' }} variant="bodyLarge">{cat.name}</Text>
            </TouchableOpacity>)}
        </View>
        <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
            <OrangeButton onPress={() => setOpen(false)}>{t('close_buttonCaption')}</OrangeButton>
            <OrangeButton onPress={() => {
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
}

const CategoriesSelect = ({ value, onChange, labelVariant, label }: Props) => {
    const appContext = useContext(AppContext)
    const [ open, setOpen ] = useState(false)

    const openModal = () => setOpen(true)
    
    return <LoadedZone loading={appContext.state.categories.loading} error={appContext.state.categories.error}>
        { appContext.state.categories.data ? <View style={{ paddingVertical: 10 }}>
            <TouchableOpacity onPress={openModal}>
                <View style={{ display: 'flex', flexDirection: 'row' }}>
                    <TransparentTextInput label={<StyledLabel variant={labelVariant} label={label || t('resourceCategories_label')} />} editable={false} 
                        value={( value.map(cat => cat.name).join(', '))} right={<TextInput.Icon color="#000" onPress={openModal} size={26} icon="chevron-right"/>} 
                        style={{ margin: 0, flex: 1 }} />
                </View>
            </TouchableOpacity>
            <Portal>
                <CategoriesSelectModal categories={appContext.state.categories.data} initialCategories={value} open={open} setOpen={setOpen}
                    onChange={onChange} />
            </Portal>
        </View> : <></> }
    </LoadedZone>

}

export default CategoriesSelect