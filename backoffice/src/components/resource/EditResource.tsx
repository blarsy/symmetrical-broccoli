import { Box, Checkbox, FormControlLabel, FormGroup, Stack, TextField, Typography } from "@mui/material"
import AddIcon from '@mui/icons-material/Add'
import { DateTimePicker } from '@mui/x-date-pickers'
import { ErrorMessage, Form, Formik } from "formik"
import { ReactNode, useState } from "react"
import * as yup from 'yup'
import { LoadingButton } from "@mui/lab"
import Feedback from "../Feedback"
import dayjs, { Dayjs } from "dayjs"
import { Category, Image, Resource } from "@/schema"
import ResourceImages from "./ResourceImages"
import { fromData, fromError, initial } from "@/DataLoadState"
import { ResourceImage } from "./ResourceImage"
import CategoriesSelect from "./CategoriesSelect"

interface Props {
    data: Resource,
    buttonName?: string,
    buttonIcon?: ReactNode,
    onSubmit: (values: {
        title: string, description: string, 
        expiration: dayjs.Dayjs, categories: Category[],
        isProduct: boolean, isService: boolean,
        canBeDelivered: boolean, canBeExchanged: boolean,
        canBeGifted : boolean, canBeTakenAway: boolean
    }, images: ResourceImage[]) => Promise<any>,
    onImageSelected?: (file: ResourceImage ) => void,
    onRequestImageDelete?: (image: Image) => Promise<void>
}

interface FormValues {
    title: string, description: string, 
    expiration: dayjs.Dayjs, images: Image[],
    categories: Category[], isProduct: boolean,
    isService: boolean, canBeDelivered: boolean, 
    canBeExchanged: boolean, canBeGifted : boolean, 
    canBeTakenAway: boolean
}

interface CheckboxGroupProps {
    title: string
    options: {
        [name: string]: string
    }
    values: { [name: string]: boolean }
    onChanged: (values: { [name: string]: boolean }) => void
}

export const CheckboxGroup = (props: CheckboxGroupProps) => {
    const [values, setValues] = useState(props.values)
    return <Stack flexDirection="column" alignContent="center">
        <Typography>{props.title}</Typography>
        <Stack flexDirection="row">
            { Object.entries(props.options).map((p, idx) => <FormGroup key={idx}>
                <FormControlLabel label={p[1]} control={<Checkbox onChange={() => {
                    values[p[0]] = !values[p[0]]
                    setValues(values)
                    props.onChanged(values)
                }} checked={values[p[0]]} />}/>
            </FormGroup> ) }
        </Stack>
    </Stack>
}

const EditResource = ({ data, onSubmit, buttonName = 'Créer', 
        buttonIcon = <AddIcon/>, onImageSelected, onRequestImageDelete}: Props ) => {
    const [ feedback, setFeedback ] = useState(initial<null>(false))
    const [ images, setImages ] = useState([] as ResourceImage[])
    
    const minExpiration = dayjs(new Date(Date.now() + 60 * 60 * 1000))
    return <Formik initialValues={{ title: data.title, description: data.description, 
        expiration: dayjs(data.expiration), images: data.images, isProduct: data.isProduct,
        isService: data.isService, canBeDelivered: data.canBeDelivered, canBeExchanged: data.canBeExchanged,
        canBeGifted : data.canBeGifted, canBeTakenAway: data.canBeTakenAway, categories: data.categories} as FormValues}
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
            categories: yup.array(yup.object({
                id: yup.number().required(),
                name: yup.string()
            })),    
            isProduct: yup.bool().test('natureIsPresent', 'Veuillez sélectionner au moins une option', (val, ctx) => {
                return val || ctx.parent.isService
            }),
            canBeGifted: yup.bool().test('transportIsPresent', 'Veuillez sélectionner au moins une option', (val, ctx) => {
                return val || ctx.parent.canBeExchanged
            }),
            canBeTakenAway: yup.bool().test('exchangeTypeIsPresent', 'Veuillez sélectionner au moins une option', (val, ctx) => {
                return val || ctx.parent.canBeDelivered
            })
        })} >
        {({
            values,
            errors,
            touched,
            handleChange,
            isSubmitting,
            getFieldProps, 
            setFieldValue,
            setTouched
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
                    <CheckboxGroup title="Nature" options={{
                        isProduct: "Produit",
                        isService: "Service"
                    }} values={{ isProduct: values.isProduct, isService: values.isService }} onChanged={val => {
                        setFieldValue('isProduct', val.isProduct)
                        setTouched({ isProduct: true })
                        setFieldValue('isService', val.isService)
                        setTouched({ isService: true })
                    }} />
                    <ErrorMessage name="isProduct" render={msg => <Typography color="error">{msg}</Typography>} />
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
                    <CategoriesSelect onChange={(categories: Category[]) => {
                        setFieldValue('categories', categories)
                    }} value={values.categories} />
                    <CheckboxGroup title="Transport" options={{
                        canBeTakenAway: "A emporter",
                        canBeDelivered: "Livraison"
                    }} values={{ canBeTakenAway: values.canBeTakenAway, canBeDelivered: values.canBeDelivered }} onChanged={val => {
                        setFieldValue('canBeTakenAway', val.canBeTakenAway)
                        setTouched({ canBeTakenAway: true })
                        setFieldValue('canBeDelivered', val.canBeDelivered)
                        setTouched({ canBeDelivered: true })
                    }} />
                    <ErrorMessage name="canBeTakenAway" render={msg => <Typography color="error">{msg}</Typography>} />
                    <CheckboxGroup title="Type d'échange" options={{
                        canBeGifted: "Don Ok",
                        canBeExchanged:"Troc Ok"
                    }} values={{ canBeGifted: values.canBeGifted, canBeExchanged: values.canBeExchanged }} onChanged={val => {
                        setFieldValue('canBeGifted', val.canBeGifted)
                        setTouched({ canBeGifted: true })
                        setFieldValue('canBeExchanged', val.canBeExchanged)
                        setTouched({ canBeExchanged: true })
                    }} />
                    <ErrorMessage name="canBeGifted" render={msg => <Typography color="error">{msg}</Typography>} />
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