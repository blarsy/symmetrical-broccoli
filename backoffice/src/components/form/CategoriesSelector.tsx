import LoadedZone from "../scaffold/LoadedZone"
import { Checkbox, FormControlLabel } from "@mui/material"
import { useState } from "react"
import useCategories from "@/lib/useCategories"

interface Props {
    values: number[]
    onSelectionChanged: (newSelection: number []) => void
}

const CategoriesSelector = (p: Props) => {
    const { loading, data, error } = useCategories()
    const [selectedCategories, setSelectedCategories] = useState<number[]>(p.values)

    return <LoadedZone loading={loading} error={error}>
        { data && data.map((cat: any, idx: number) => <FormControlLabel key={idx} control={
            <Checkbox size="small" sx={{ padding: '0 0.25rem' }} checked={selectedCategories.includes(cat.code)} onChange={e => {
                setSelectedCategories(prev => {
                    let newValue: number[] = []
                    if(selectedCategories.includes(cat.code)) {
                        newValue = prev.filter(val => val != cat.code)
                    } else {
                        newValue = [...prev]
                        newValue.push(cat.code)
                    }
                    setTimeout(() => p.onSelectionChanged(newValue))
                    return newValue
                })
        }} />} label={cat.name} sx={{
            '& .MuiFormControlLabel-label': {
                color: 'primary.main'
            }
        }} />)}
    </LoadedZone>
}

export default CategoriesSelector