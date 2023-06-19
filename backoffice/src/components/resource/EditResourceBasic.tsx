import { Box, TextField } from "@mui/material"
import AddIcon from '@mui/icons-material/Add'
import { DateTimePicker } from '@mui/x-date-pickers'
import { Formik } from "formik"
import { ReactNode, useState } from "react"
import * as yup from 'yup'
import { LoadingButton } from "@mui/lab"
import Feedback from "../Feedback"
import dayjs, { Dayjs } from "dayjs"
import { Condition, Image, Resource } from "@/schema"
import ResourceImages from "./ResourceImages"
import ResourceConditions from "./ResourceConditions"

interface Props {
    onSuccess: (itemSaved: any) => void,
    data: Resource,
    buttonName?: string,
    buttonIcon?: ReactNode,
    onSubmit: (values: {
        title: string
        description: string
        expiration: dayjs.Dayjs
    }) => Promise<any>
}

const EditResourceBasic = ({ data, onSuccess, onSubmit, buttonName = 'Créer', buttonIcon = <AddIcon/> }: Props ) => {
    const [ errorInfo, setErrorInfo ] = useState({} as { message?: string, detail?: string })
    const minExpiration = dayjs(new Date(Date.now() + 60 * 60 * 1000))
    return <Formik initialValues={{ title: data.title, description: data.description, 
        expiration: dayjs(data.expiration), images: [] as Image[], conditions: [] as Condition[]}}
        onSubmit={async (values, { setSubmitting }) => {
            try {
                const res = await onSubmit(values)
                setErrorInfo({})
                onSuccess(res.data)
            } catch(e: any) {
                setErrorInfo({ message: 'Echec de la sauvegarde.', detail: e.toString() })
            } finally {
                setSubmitting(false)
            }
        }} validationSchema={yup.object().shape({
            title: yup.string().required('Ce champ est requis').max(30, 'Ce titre est trop long'),
            description: yup.string().required('Ce champ est requis'),
            expiration: yup.date().transform((value: Dayjs) => isNaN(value.valueOf()) ? undefined : value).typeError('Veuillez entrer une date valide')
                .test('expirationIsEnoughInTheFuture', 'Cette offre doit durer au moins une heure', val => {
                    return !!val && val > minExpiration.toDate()
                })
        })} >
        {({
            values,
            errors,
            touched,
            handleChange,
            handleSubmit,
            isSubmitting,
            getFieldProps, 
            setFieldValue
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
                    <DateTimePicker
                        ampm={false}
                        label="Expiration"
                        onChange={(value: any) => {
                            setFieldValue('expiration', value, true)
                        }}
                        minDateTime={minExpiration}
                        value={values.expiration} 
                        slotProps={{ textField: { size: 'small', variant: 'standard', 
                            helperText: touched.expiration && errors.expiration as string,
                            error: touched.expiration && !!errors.expiration
                        }}}
                        />
                    <ResourceImages />
                    <ResourceConditions />
                    <LoadingButton loading={isSubmitting}
                        loadingPosition="start"
                        startIcon={buttonIcon}
                        type="submit"
                        variant="contained">{buttonName}</LoadingButton>
                    {errorInfo.message && <Feedback severity="error" message={errorInfo.message} 
                        detail={errorInfo.detail} 
                        onClose={() => setErrorInfo({ message: '', detail: '' })}/>}
                </Box>
            </Box>
        </form>
        )}
    </Formik>
}

export default EditResourceBasic