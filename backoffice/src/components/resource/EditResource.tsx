import { Box, Button, IconButton, TextField, Typography } from "@mui/material"
import AddIcon from '@mui/icons-material/Add'
import { DateTimePicker } from '@mui/x-date-pickers'
import { FieldArray, Form, Formik, FormikErrors, FormikTouched, getIn } from "formik"
import { ReactNode, useState } from "react"
import * as yup from 'yup'
import { LoadingButton } from "@mui/lab"
import Feedback from "../Feedback"
import dayjs, { Dayjs } from "dayjs"
import { Condition, Image, Resource } from "@/schema"
import ResourceImages from "./ResourceImages"
import { fromData, fromError, initial } from "@/app/DataLoadState"
import { ResourceImage } from "./ResourceImage"
import CreateIcon from '@mui/icons-material/Create'
import DeleteIcon from '@mui/icons-material/Delete'

interface Props {
    data: Resource,
    buttonName?: string,
    buttonIcon?: ReactNode,
    onSubmit: (values: {
        title: string
        description: string
        expiration: dayjs.Dayjs,
        conditions: Condition[]
    }, images: ResourceImage[]) => Promise<any>,
    onImageSelected?: (file: ResourceImage ) => void,
    onRequestImageDelete?: (image: Image) => Promise<void>
}

interface FormValues {
    title: string, description: string, 
    expiration: dayjs.Dayjs, images: Image[], conditions: Condition[]
}

const isTouched = (touched: FormikTouched<FormValues>, idx: number, propName: string):boolean => {
    return !!touched.conditions && !!touched.conditions[idx] && !!(touched.conditions[idx] as any)[propName]
}

const errorMessage = (touched: FormikTouched<FormValues>, idx: number, errors: FormikErrors<FormValues>, propName: string): string | undefined => {
    return isTouched(touched, idx, propName) && errors.conditions && errors.conditions[idx] && (errors.conditions[idx] as any)[propName]
}

const EditResource = ({ data, onSubmit, buttonName = 'Créer', 
        buttonIcon = <AddIcon/>, onImageSelected, onRequestImageDelete}: Props ) => {
    const [ feedback, setFeedback ] = useState(initial<null>(false))
    const [ images, setImages ] = useState([] as ResourceImage[])
    
    const minExpiration = dayjs(new Date(Date.now() + 60 * 60 * 1000))
    return <Formik initialValues={{ title: data.title, description: data.description, 
        expiration: dayjs(data.expiration), images: data.images, conditions: data.conditions} as FormValues}
        onSubmit={async (values, { setSubmitting }) => {
            try {
                await onSubmit(values, images)
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
                    return !!val && !!(data.id || val > minExpiration.toDate())
                }),
            conditions: yup.array(yup.object({
                title: yup.string().max(30, 'Ce titre est trop long.').required('Ce champ est requis.'),
                description: yup.string().max(8000, 'Cette valeur est trop longue.').required('Ce champ est requis.')
            }))
        })} >
        {({
            values,
            errors,
            touched,
            handleChange,
            isSubmitting,
            getFieldProps, 
            setFieldValue,
            handleBlur
        }) => (
        <Form>
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
                        existingImages={data.images} onImageSelected={onImageSelected} 
                        onRequestImageDelete={onRequestImageDelete || (async () => {})}/>
                    <Typography variant="body1">Conditions</Typography>
                    <Box>
                        <FieldArray name="conditions" 
                            render={arrayHelpers => <Box display="flex" flexDirection="column" gap="0.5rem">
                                {values.conditions.map((condition, idx) => <Box key={idx} display="flex" flexDirection="row">
                                    <TextField sx={{ flex: '1 0 30%' }} id="title" size="small" name={`conditions[${idx}].title`} multiline
                                        label="Titre" type="text" variant="standard" value={condition.title} 
                                        onChange={handleChange} onBlur={handleBlur} error={!!errorMessage(touched, idx, errors, 'title')} 
                                        helperText={errorMessage(touched, idx, errors, 'title')}/>
                                    <TextField sx={{ flex: '1 0 70%' }} id="description" size="small" name={`conditions[${idx}].description`} multiline
                                        label="Description" type="text" variant="standard" value={condition.description} 
                                        onChange={handleChange} onBlur={handleBlur} error={!!errorMessage(touched, idx, errors, 'description')} 
                                        helperText={errorMessage(touched, idx, errors, 'description')}/>
                                    <IconButton onClick={() => arrayHelpers.remove(idx)}><DeleteIcon /></IconButton>
                                </Box>)}
                                <Button sx={{ alignSelf: 'flex-start' }} variant="outlined" startIcon={<CreateIcon />} onClick={() => arrayHelpers.push({})}>Ajouter</Button>
                            </Box>} />
                    </Box>
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
        </Form>
        )}
    </Formik>
}

export default EditResource