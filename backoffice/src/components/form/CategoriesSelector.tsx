import { gql, useQuery } from "@apollo/client"
import LoadedZone from "../scaffold/LoadedZone"
import { Checkbox, FormControlLabel } from "@mui/material"
import { useState } from "react"

export const GET_CATEGORIES = gql`query Categories($locale: String) {
    allResourceCategories(condition: {locale: $locale}) {
        nodes {
          code
          name
        }
      }
  }
`

interface Props {
    lang: string
    values: number[]
    onSelectionChanged: (newSelection: number []) => void
}

const CategoriesSelector = (p: Props) => {
    const { data, loading, error } = useQuery(GET_CATEGORIES, { variables: { locale: p.lang } })
    const [selectedCategories, setSelectedCategories] = useState<number[]>(p.values)

    return <LoadedZone loading={loading} error={error}>
        { data && data.allResourceCategories.nodes.map((cat: any, idx: number) => <FormControlLabel key={idx} control={
            <Checkbox size="small" sx={{ padding: '0 0.25rem' }} checked={selectedCategories.includes(cat.code)} onChange={e => {
                let newValue: number[] = []
                setSelectedCategories(prev => {
                    if(selectedCategories.includes(cat.code)) {
                        return prev.filter(val => val != cat.code)
                    }
                    newValue = [...prev]
                    newValue.push(cat.code)

                    return newValue
                })
                p.onSelectionChanged(newValue)
        }} />} label={cat.name} sx={{
            '& .MuiFormControlLabel-label': {
                color: 'primary.main'
            }
        }} />)}
    </LoadedZone>
}

export default CategoriesSelector