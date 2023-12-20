import { t } from "@/i18n"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { getResourceCategories } from "@/lib/api"
import { Category } from "@/lib/schema"
import { useEffect, useState } from "react"
import LoadedZone from "../LoadedZone"
import React from "react"
import { TouchableOpacity, View } from "react-native"
import { Modal, Portal, Text, TextInput } from "react-native-paper"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { OrangeButton, StyledLabel, TransparentTextInput } from "../layout/lib"
import { VariantProp } from "react-native-paper/lib/typescript/components/Typography/types"

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
            {categories.map(cat => <Text style={{ color: selectedCategories.some(selectedCat => selectedCat.id === cat.id ) ? primaryColor : 'initial' }} variant="bodyLarge" onPress={() => {
                if(selectedCategories.some(selectedCat => selectedCat.id === cat.id )) {
                    setSelectedCategories(selectedCategories.filter(selectedCat => selectedCat.id != cat.id))
                } else {
                    setSelectedCategories([...selectedCategories, cat])
                }
            }} key={cat.id}>{cat.name}</Text>)}
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
    const [ categories, setCategories ] = useState(initial<Category[]>(true, []))
    const [ open, setOpen ] = useState(false)
    useEffect(() => {
        const load = async () => {
            try {
                const categories = await getResourceCategories()
                setCategories(fromData(categories.sort((a, b) => a.name.localeCompare(b.name))))
            } catch (e) {
                setCategories(fromError(e, t('requestError')))
            }
        }
        load()
    }, [])

    const openModal = () => setOpen(true)
    
    return <LoadedZone loading={categories.loading} error={categories.error}>
        { categories.data ? <View style={{ paddingVertical: 10 }}>
            <TouchableOpacity onPress={openModal}>
                <View style={{ display: 'flex', flexDirection: 'row' }}>
                    <TransparentTextInput label={<StyledLabel variant={labelVariant} label={label || t('resourceCategories_label')} />} editable={false} 
                        value={( value.map(cat => cat.name).join(', '))} right={<TextInput.Icon color="#000" onPress={openModal} size={26} icon="chevron-right"/>} 
                        style={{ margin: 0, flex: 1 }} />
                </View>
            </TouchableOpacity>
            <Portal>
                <CategoriesSelectModal categories={categories.data} initialCategories={value} open={open} setOpen={setOpen}
                    onChange={onChange} />
            </Portal>
        </View> : <></> }
    </LoadedZone>

}

export default CategoriesSelect