import { t } from "@/i18n"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { getResourceCategories } from "@/lib/api"
import { Category } from "@/lib/schema"
import { useEffect, useState } from "react"
import { PaperSelect } from "react-native-paper-select"
import LoadedZone from "../LoadedZone"
import React from "react"

interface Props {
    value: Category[]
    onChange: (categories: Category[])=> void
}

const CategoriesSelect = ({ value, onChange }: Props) => {
    const [ categories, setCategories ] = useState(initial<Category[]>(true, []))
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

    return <LoadedZone loading={categories.loading} error={categories.error}>
        { categories.data ? <PaperSelect multiEnable arrayList={categories.data!.map(cat => ({ _id: cat.id.toString(), value: cat.name }))} 
            label={t('resourceCategories_label')} value={value.map(cat => cat.name).join(', ')}
            selectedArrayList={value.map(cat => ({ _id: cat.id.toString(), value: cat.name }))}
            hideSearchBox={true}
            selectAllEnable={false} searchText="" dialogCloseButtonText={t('close_buttonCaption')} dialogDoneButtonText={t('done_buttonCaption')}
            onSelection={item => onChange(item.selectedList.map(sel => categories.data!.find(cat => cat.id.toString() === sel._id)!))}
            containerStyle={{ backgroundColor: 'transparent' }} textInputStyle={{ backgroundColor: 'transparent' }}
            searchStyle={{ backgroundColor: 'transparent' }}/>:
            <></> }
    </LoadedZone>

}

export default CategoriesSelect