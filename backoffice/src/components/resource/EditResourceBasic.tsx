import { Box, TextField, Typography } from "@mui/material"
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
import { fromData, fromError, initial } from "@/app/DataLoadState"

interface Props {
    data: Resource,
    buttonName?: string,
    buttonIcon?: ReactNode,
    onSubmit: (values: {
        title: string
        description: string
        expiration: dayjs.Dayjs
    }, images: File[]) => Promise<any>,
    onImagesSelected?: (files: File[]) => void,
    onRequestImageDelete: (image: Image) => Promise<void>
}

const EditResourceBasic = ({ data, onSubmit, buttonName = 'Créer', 
        buttonIcon = <AddIcon/>, onImagesSelected, onRequestImageDelete}: Props ) => {
    const [ feedback, setFeedback ] = useState(initial<null>(false))
    const [ images, setImages ] = useState([] as File[])
    
    const minExpiration = dayjs(new Date(Date.now() + 60 * 60 * 1000))
    return <Formik initialValues={{ title: data.title, description: data.description, 
        expiration: dayjs(data.expiration), images: data.images as Image[], conditions: [] as Condition[]}}
        onSubmit={async (values, { setSubmitting }) => {
            try {
                const res = await onSubmit(values, images)
                setFeedback(fromData(null))
            } catch(e: any) {
                setFeedback(fromError(e, 'Echec de la sauvegarde.'))
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
                <Box display="flex" flexDirection="column" gap="0.5rem" flex="1">
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
                    <Typography variant="body1">Photos</Typography>
                    <ResourceImages justifySelf="stretch" images={images} setImages={setImages} 
                        existingImages={data.images} onImagesSelected={onImagesSelected} 
                        onRequestImageDelete={onRequestImageDelete}/>
                    <Typography variant="body1">Conditions</Typography>
                    <ResourceConditions />
                    <LoadingButton loading={isSubmitting}
                        loadingPosition="start"
                        startIcon={buttonIcon}
                        type="submit"
                        variant="contained">{buttonName}</LoadingButton>
                    {feedback.error?.message && <Feedback severity="error" message={feedback.error!.message} 
                        detail={feedback.error!.detail} 
                        onClose={() => setFeedback(initial<null>(false))}/>}
                </Box>
            </Box>
        </form>
        )}
    </Formik>
}

export default EditResourceBasic