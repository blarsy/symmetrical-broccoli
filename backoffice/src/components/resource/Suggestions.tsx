import { beginOperation, fromData, fromError, initial } from "@/DataLoadState"
import { Category, Resource } from "@/schema"
import { Box, TextField, Typography } from "@mui/material"
import axios from "axios"
import { useEffect, useState } from "react"
import LoadingList from "../LoadingList"
import ResourceCard from "./ResourceCard"
import { Form, Formik } from "formik"
import * as yup from 'yup'
import CategoriesSelect from "./CategoriesSelect"
import { useDebounce } from 'usehooks-ts'

const Suggestions = () => {
    const [suggestedResourcesState, setSuggestedResourcesState] = useState(initial<Resource[]>(false))
    const [filters, setFilters] = useState({search: '', categories: [] as Category[]})
    const debouncedFilters = useDebounce(filters, 1000)

    const load = async (searchString: string, categoriesFilter: string[]) => {
        try {
            setSuggestedResourcesState(beginOperation())
            const apiUriTokens = []
            if(searchString || (categoriesFilter && categoriesFilter.length > 0)) {
                if(searchString){
                    apiUriTokens.push(`search=${searchString}`)
                }
                if(categoriesFilter && categoriesFilter.length > 0) {
                    apiUriTokens.push(`categories=${categoriesFilter.join(',')}`)
                }
            }
            const apiUrl = `/api/resource/suggestions${apiUriTokens.length > 0 ? `?${apiUriTokens.join(',')}` : ''}`
            const resourcesRes = await axios.get(apiUrl, { headers: { Authorization: localStorage.getItem('token') }})
            setSuggestedResourcesState(fromData<Resource[]>(resourcesRes.data))
        } catch(e : any) {
            setSuggestedResourcesState(fromError(e, 'Erreur pendant le chargement des données.'))
        }
    }

    useEffect(() => {
        load(filters.search, filters.categories.map(cat => cat.id.toString()))
    }, [debouncedFilters])
    return <Box display="display" flexDirection="column">
        <Typography variant="h2">Suggestions</Typography>
        <Formik initialValues={{ search: '', categories: [] as Category[] }}
            onSubmit={values => {
                setFilters(values)
            }} validationSchema={yup.object().shape({
                search: yup.string(),
                categories: yup.array(yup.object({
                    id: yup.number().required(),
                    name: yup.string()
                }))
            })} >
            {({
                values,
                errors,
                touched,
                getFieldProps, 
                setFieldValue,
                submitForm
            }) => (
            <Form>
                <Box display="flex" flexDirection="row" gap="0.5rem" flex="1">
                    <TextField size="small" id="search" variant="standard" type="text" {...getFieldProps('search')} 
                        label="filtre" error={!!errors.search} helperText={touched.search && errors.search} onChange={e => {
                            setFieldValue('search', e.target.value)
                            submitForm()
                        }} value={values.search}/>
                    <CategoriesSelect onChange={(categories: Category[]) => {
                        setFieldValue('categories', categories)
                    }} value={values.categories} onClose={() => submitForm()}/>
                </Box>
            </Form>
            )}
        </Formik>
        <LoadingList loadState={suggestedResourcesState} onErrorClosed={() => setSuggestedResourcesState(initial<Resource[]>(false))}
            displayItem={(resource: Resource) => (<ResourceCard resource={resource} onClick={() => {}} />)} />
    </Box>
}

export default Suggestions