import { Box, TextField } from "@mui/material"
import AddIcon from '@mui/icons-material/Add'
import { DateTimePicker } from '@mui/x-date-pickers'
import axios from "axios"
import { Formik } from "formik"
import { useState } from "react"
import * as yup from 'yup'
import { LoadingButton } from "@mui/lab"
import Feedback from "../Feedback"

interface Props {
    onSuccess: (itemSaved: any) => void
}

const EditResource = ({ onSuccess }: Props ) => {
    const [ errorInfo, setErrorInfo ] = useState({} as { message: string, detail: string })
    return <Formik initialValues={{ title: '', description: '', 
        expiration: Date.now() + 30 * 24 * 60 * 60 * 1000 }}
        onSubmit={async (values, { setSubmitting }) => {
            try {
                const res = await axios.post('/api/resource', { 
                    title: values.title, description: values.description, expiration: values.expiration })
                onSuccess(res)
            } catch(e: any) {
                setErrorInfo({ message: 'Echec de l\'authentification.', detail: e.toString() })
            } finally {
                setSubmitting(false)
            }
        }} validationSchema={yup.object().shape({
            titre: yup.string().required('Ce champ est requis').length(30, 'Ce titre est trop long'),
            description: yup.string().required('Ce champ est requis'),
            expiration: yup.date().min(new Date(Date.now() + 60 * 60 * 1000), 'Cette offre doit durer au moins une heure')
        })} >
        {({
            values,
            errors,
            touched,
            handleChange,
            handleSubmit,
            isSubmitting,
            getFieldProps
        }) => (
        <form onSubmit={handleSubmit}>
            <Box display="flex" padding="1rem" justifyContent="center">
                <Box display="flex" flexDirection="column" maxWidth="25em" gap="0.5rem">
                    <TextField size="small" id="title" variant="standard" type="text" {...getFieldProps('title')} 
                        label="Titre" error={!!errors.title} helperText={touched.title && errors.title}/>
                    <TextField id="description" size="small" name="description" multiline
                        label="Description" type="text" variant="standard" value={values.description} 
                        onChange={handleChange} error={touched.description && !!errors.description} 
                        helperText={touched.description && errors.description as string}/>
                    <LoadingButton loading={isSubmitting}
                        loadingPosition="start"
                        startIcon={<AddIcon />}
                        type="submit"
                        variant="contained">Créer</LoadingButton>
                    {errorInfo.message && <Feedback severity="error" message={errorInfo.message} 
                        detail={errorInfo.detail} 
                        onClose={() => setErrorInfo({ message: '', detail: '' })}/>}
                </Box>
            </Box>
        </form>
        )}
    </Formik>
}

export default EditResource