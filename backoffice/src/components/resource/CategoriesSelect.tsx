import { Category } from "@/schema"
import { FormControl, InputLabel, Select, OutlinedInput, Chip, MenuItem } from "@mui/material"
import { Box } from "@mui/system"
import { useEffect, useState } from "react"
import { fromData, fromError, initial } from "@/DataLoadState"
import axios from "axios"
import LoadingZone from "../LoadingZone"

interface Props {
    onChange: (categories: Category[]) => void
    value: Category[]
}

const CategoriesSelect = ({ onChange, value }: Props) => {
    const [categories, setCategories] = useState(initial<Category[]>(true))
    useEffect(() => {
        const load = async () => {
            try{
                const categories = await axios.get(`/api/resource/categories`)
                setCategories(fromData(categories.data))
            } catch(e) {
                setCategories(fromError(e, 'Erreur au chargement'))
            }
        }
        load()
    }, [])
    return <LoadingZone loadState={categories} onErrorClosed={() => setCategories(initial<Category[]>(false))}>
        <FormControl>
            <InputLabel id="categories_label">Categorie</InputLabel>
            <Select
                labelId="categories_label"
                id="categories"
                multiple
                value={value.map(cat => cat.id)}
                onChange={e => {
                    onChange((e.target.value as number[]).map(catId => categories.data!.find(cat => cat.id === catId)!))
                }}
                input={<OutlinedInput id="select-multiple-categories" label="Categorie" />}
                renderValue={(selected) => {
                    return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                            const cat = categories.data!.find(cat => cat.id === value)!
                            return <Chip key={value} label={cat.name} />
                    })}
                    </Box>
                }}>
                    { categories.data && categories.data.map(cat => <MenuItem
                        key={cat.id}
                        value={cat.id}>
                        {cat.name}
                    </MenuItem>)}
            </Select>
        </FormControl>
    </LoadingZone>
}

export default CategoriesSelect