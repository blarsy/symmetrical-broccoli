import { alpha, Checkbox, FormControlLabel, IconButton, Stack, TextField, Typography } from "@mui/material"
import { ErrorMessage, Form, Formik } from "formik"
import { useContext, useState } from "react"
import * as yup from 'yup'
import { ErrorText } from "../misc"
import OptionLine from "../form/OptionLine"
import { Category, Resource } from "@/lib/schema"
import useProfileAddress from "../user/useProfileAddress"
import LoadedZone from "../scaffold/LoadedZone"
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from "dayjs"
import useCategories from "@/lib/useCategories"
import Edit from "@mui/icons-material/Edit"
import CategoriesDialog from "../form/CategoriesDialog"
import EditAddress from "../user/EditAddress"
import { ApolloError, gql, useMutation } from "@apollo/client"
import DataLoadState, { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { LoadingButton } from "@mui/lab"
import Feedback from "../scaffold/Feedback"
import EditImage from "./EditImage"
import { useRouter } from "next/navigation"
import { UiContext } from "../scaffold/UiContextProvider"
import ExplainToken from "../token/ExplainToken"

interface Props {
    value?: Resource
}

export const UPDATE_RESOURCE = gql`mutation UpdateResource($resourceId: Int, $categoryCodes: [Int], 
    $canBeDelivered: Boolean, $canBeExchanged: Boolean, $canBeGifted: Boolean, $canBeTakenAway: Boolean, 
    $title: String, $isService: Boolean, $isProduct: Boolean, $imagesPublicIds: [String], 
    $expiration: Datetime, $description: String, $specificLocation: NewLocationInput = {}, $price: Int) {
    updateResource(
      input: {resourceId: $resourceId, canBeDelivered: $canBeDelivered, canBeExchanged: $canBeExchanged, 
        canBeGifted: $canBeGifted, canBeTakenAway: $canBeTakenAway, categoryCodes: $categoryCodes, 
        description: $description, expiration: $expiration, imagesPublicIds: $imagesPublicIds, 
        isProduct: $isProduct, isService: $isService, title: $title, 
        specificLocation: $specificLocation, price: $price}
    ) {
      integer
    }
}`

export const CREATE_RESOURCE = gql`mutation CreateResource($categoryCodes: [Int], $canBeDelivered: Boolean, 
    $canBeExchanged: Boolean, $canBeGifted: Boolean, $canBeTakenAway: Boolean, $title: String, 
    $isService: Boolean, $isProduct: Boolean, $imagesPublicIds: [String], $expiration: Datetime, 
    $description: String, $specificLocation: NewLocationInput = {}, $price: Int) {
    createResource(
      input: {canBeDelivered: $canBeDelivered, canBeExchanged: $canBeExchanged, canBeGifted: $canBeGifted, 
        canBeTakenAway: $canBeTakenAway, categoryCodes: $categoryCodes, description: $description, 
        expiration: $expiration, imagesPublicIds: $imagesPublicIds, isProduct: $isProduct, isService: $isService, 
        title: $title, specificLocation: $specificLocation, price: $price}
    ) {
      integer
    }
  }`

export const SWITCH_TO_CONTRIBUTION_MODE = gql`mutation SwitchToContributionMode {
    switchToContributionMode(input: {}) {
        integer
    }
}`

const blankResource: Resource = {
    canBeDelivered: false, 
    canBeExchanged: false,
    canBeGifted: false,
    canBeTakenAway: false,
    categories: [],
    description: '',
    id: 0,
    isProduct: false,
    isService: false,
    images: [],
    title: '',
    created: new Date(),
    deleted: null,
    specificLocation: null,
    price: null
}

const EditResource = (p: Props) => {
    const uiContext = useContext(UiContext)
    const router = useRouter()
    const profileAddress = useProfileAddress()
    const categories = useCategories()
    const t = uiContext.i18n.translator
    const [editedCategories, setEditedCategories] = useState<Category[] | undefined>(undefined)
    const [createResource] = useMutation(CREATE_RESOURCE)
    const [updateResource] = useMutation(UPDATE_RESOURCE)
    const [switchToContributionMode] = useMutation(SWITCH_TO_CONTRIBUTION_MODE)
    const [explainingToken, setExplainingToken] = useState(false)

    const trySave = async (value: Resource) => {
        setSaveState(beginOperation())
        if(value.id) {
            await updateResource({ variables: { resourceId: value.id, canBeDelivered: value.canBeDelivered, canBeExchanged: value.canBeExchanged, 
                canBeGifted: value.canBeGifted, canBeTakenAway: value.canBeTakenAway, categoryCodes: value.categories.map(c => c.code), 
                description: value.description, expiration: value.expiration, imagesPublicIds: value.images.map(img => img.publicId), 
                isProduct: value.isProduct, isService: value.isService, title: value.title, 
                specificLocation: value.specificLocation, price: value.price ? Number(value.price) : null } })
        } else {
            await createResource({ variables: { canBeDelivered: value.canBeDelivered, canBeExchanged: value.canBeExchanged, 
                canBeGifted: value.canBeGifted, canBeTakenAway: value.canBeTakenAway, categoryCodes: value.categories.map(c => c.code), 
                description: value.description, expiration: value.expiration, imagesPublicIds: value.images.map(img => img.publicId), 
                isProduct: value.isProduct, isService: value.isService, title: value.title, 
                specificLocation: value.specificLocation, price: value.price ? Number(value.price) : null } })
        } 
        setSaveState(fromData(undefined))
    }

    const [saveState, setSaveState] = useState<DataLoadState<undefined>>(initial(false, undefined))

    return <LoadedZone loading={profileAddress.loading || categories.loading} error={profileAddress.error}>
        { categories.data && <Formik initialValues={p.value || blankResource} onSubmit={async values => {
            try {
                await trySave(values)
                router.push('.')
            } catch(e) {
                if((e as ApolloError).message === 'ACCOUNT_CANNOT_CREATE_NON_FREE_RESOURCES') {
                    try{
                        await switchToContributionMode()
                        await trySave(values)
                        setExplainingToken(true)
                    } catch(e2) {
                        setSaveState(fromError(e2, uiContext.i18n.translator('requestError')))
                    }
                } else {
                    setSaveState(fromError(e, uiContext.i18n.translator('requestError')))
                }
            }
        }} validationSchema={yup.object().shape({
            title: yup.string().max(30, t('max30Chars')).required(t('required_field')),
            description: yup.string(),
            expiration: yup.date().nullable().min(new Date(), t('dateMustBeFuture')),
            price: yup.number().nullable().integer(t('mustBeAnInteger')).min(1, t('mustBeAValidNumber'))
                .test('priceSetIfCanBeExchanged', t('required_field'), (val, ctx) => {
                    return !ctx.parent.canBeExchanged || !!val
                }),
            categories: yup.array().min(1, t('required_field')),
            isProduct: yup.bool().test('natureIsPresent', t('required_field'), (val, ctx) => {
                return val || ctx.parent.isService
            }),
            canBeGifted: yup.bool().test('transportIsPresent', t('required_field'), (val, ctx) => {
                return val || ctx.parent.canBeExchanged
            }),
            canBeTakenAway: yup.bool().test('exchangeTypeIsPresent', t('required_field'), (val, ctx) => {
                return !ctx.parent.isProduct || (val || ctx.parent.canBeDelivered)
            }),
            specificLocation: yup.object().nullable().test('addressRequiredWhenResourceOnSite', t('addressRequiredWhenResourceOnSite'), (val, ctx) => {
                return !ctx.parent.canBeTakenAway || !!val
            })
        })}>
            { f => {
                return <Form onSubmit={f.handleSubmit}>
                    <Stack>
                        <Stack gap="1rem" flex="1" paddingBottom="6rem">
                            <Typography variant="body1" color="primary">{uiContext.i18n.translator('imagesLabel')}</Typography>
                            { f.values.images.length > 0 && <Stack direction="row">
                                { f.values.images.map((imgInfo, idx) => 
                                <EditImage key={idx} initialValue={imgInfo.publicId!} 
                                    onChange={(publicId, previousPublicId) => {
                                        f.setFieldValue('images', [ ...f.values.images.filter(i => i.publicId != previousPublicId), { publicId } ])
                                    }}
                                    onDeleteRequested={imgInfo => 
                                        f.setFieldValue('images', f.values.images.filter(i => i.publicId != imgInfo.publicId))} />) }                                
                            </Stack>}
                            <EditImage initialValue="" onDeleteRequested={() => {}} onChange={publicId => f.setFieldValue('images', [...f.values.images, { publicId }])} />
                            <TextField size="small" id="title" name="title" value={f.values.title}
                                label={uiContext.i18n.translator('titleLabel')} 
                                onChange={f.handleChange('title')} onBlur={f.handleBlur('title')}/>
                            <ErrorMessage component={ErrorText} name="title" />
                            <TextField size="small" multiline id="description" name="description" value={f.values.description}
                                label={uiContext.i18n.translator('descriptionLabel')} 
                                onChange={f.handleChange('description')} onBlur={f.handleBlur('description')}/>
                            <ErrorMessage component={ErrorText} name="description" />
                            <TextField size="small" id="price" name="price" value={f.values.price || 0}
                                label={uiContext.i18n.translator('Label')}
                                onChange={f.handleChange('price')} onBlur={f.handleBlur('price')}/>
                            <ErrorMessage component={ErrorText} name="price" />
                            <OptionLine sx={{ margin: 0 }} labels={{ 
                                title: uiContext.i18n.translator('natureOptionsLabel'), 
                                isProduct: 'isProduct',
                                isService: 'isService'
                            }} values={{ isProduct: f.values.isProduct, isService: f.values.isService }}
                                onChange={val => { 
                                    Object.entries(val).forEach(v => f.setFieldValue(v[0], v[1]))
                                }}/>
                            <ErrorMessage component={ErrorText} name="isProduct" />
                            <Stack direction="row" alignItems="flex-start" gap="1rem">
                                <Typography variant="body1" sx={{ flex: '0 0 7rem' }} color="primary">{uiContext.i18n.translator('expirationFieldLabel')}</Typography>
                                <FormControlLabel sx={{ 
                                    flex: 1,
                                    '& .MuiFormControlLabel-label': {
                                        color: 'primary.main'
                                    }
                                }} 
                                control={<Checkbox size="small" sx={{ padding: '0 0.25rem' }} checked={f.values.expiration === null} onChange={e => {
                                    if(f.values.expiration === null) {
                                        f.setFieldValue('expiration', dayjs().add(1, 'week'))
                                    } else {
                                        f.setFieldValue('expiration', null)
                                    }
                                }} />} label={uiContext.i18n.translator('permanentLabel')} />
                                <DatePicker closeOnSelect defaultValue={dayjs()} disablePast disabled={f.values.expiration === null}
                                    label={uiContext.i18n.translator('expirationLabel')} value={dayjs(f.values.expiration)} 
                                    onChange={e => {
                                        f.setFieldValue('expiration', e?.toDate())
                                    }} />
                            </Stack>
                            <ErrorMessage component={ErrorText} name="expiration" />
                            <Stack direction="row" justifyContent="space-between" gap="2rem">
                                <Typography variant="body1" sx={{ flex: '0 0 7rem' }} color="primary">{uiContext.i18n.translator('categoriesLabel')}</Typography>
                                <Typography variant="body1" sx={{ flex: 1 }} color="primary">{f.values.categories.map(cat => cat.name).join(', ')}</Typography>
                                <IconButton onClick={() => setEditedCategories(f.values.categories)}><Edit/></IconButton>
                            </Stack>
                            <ErrorMessage component={ErrorText} name="categories" />
                            <OptionLine sx={{ margin: 0 }} labels={{ 
                                title: uiContext.i18n.translator('exchangeTypeOptionsLabel'),
                                canBeGifted: 'canBeGifted',
                                canBeExchanged: 'canBeExchanged'
                            }} values={{ canBeGifted: f.values.canBeGifted, canBeExchanged: f.values.canBeExchanged }}
                                onChange={val => { 
                                    Object.entries(val).forEach(v => f.setFieldValue(v[0], v[1]))
                                }}/>
                            <ErrorMessage component={ErrorText} name="canBeGifted" />
                            <OptionLine sx={{ margin: 0 }} labels={{ 
                                title: uiContext.i18n.translator('deliveryOptionsLabel'),
                                canBeTakenAway: f.values.isProduct ? 'canBeTakenAway' : 'onSite',
                                canBeDelivered: f.values.isProduct ? 'canBeDelivered': 'placeToBeAgreed'
                            }} values={{ canBeTakenAway: f.values.canBeTakenAway, canBeDelivered: f.values.canBeDelivered }}
                                onChange={val => { 
                                    Object.entries(val).forEach(v => f.setFieldValue(v[0], v[1]))
                                }}/>
                            <ErrorMessage component={ErrorText} name="canBeTakenAway" />
                            <Typography variant="body1" color="primary">{uiContext.i18n.translator('addressEditTitle')}</Typography>
                            <Stack alignItems="center">
                                <EditAddress value={f.values.specificLocation}
                                    onChange={newLoc => f.setFieldValue('specificLocation', newLoc)} />
                            </Stack>
                            <ErrorMessage component={ErrorText} name="specificLocation" />
                        </Stack>
                        <Stack padding="1rem 2rem" sx={theme => ({ bottom: 0, left: 0, position: 'fixed', width: '100%', backgroundColor: alpha(theme.palette.secondary.main, 0.5) })} >
                            <Feedback severity="error" visible={!!saveState.error}
                                onClose={() => setSaveState(initial(false, undefined))}
                                detail={saveState.error?.detail} />
                            { f.submitCount > 0 && !f.isValid && <ErrorText>{uiContext.i18n.translator('someValuesInvalid')}</ErrorText> }
                            <Stack justifyContent="center" direction="row">
                                <LoadingButton variant="contained" loading={saveState.loading} 
                                    disabled={saveState.loading} 
                                    onClick={() => f.handleSubmit()}>
                                    {uiContext.i18n.translator('saveButtonLabel')}
                                </LoadingButton>
                            </Stack>
                        </Stack>
                    </Stack>
                    <CategoriesDialog visible={!!editedCategories} value={f.values.categories}
                        onClose={newCats => {
                            if(newCats){
                                f.setFieldValue('categories', newCats)
                            }
                            setEditedCategories(undefined)
                        }} />
                    
                </Form>
            }}
        </Formik> }
        <ExplainToken visible={explainingToken} pureExplain onClose={() => router.push('.')} />
    </LoadedZone>
}

export default EditResource