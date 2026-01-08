import { alpha, Checkbox, FormControlLabel, FormGroup, IconButton, Stack, SxProps, TextField, Theme, Typography, useTheme } from "@mui/material"
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
import { gql, useMutation } from "@apollo/client"
import DataLoadState, { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { LoadingButton } from "@mui/lab"
import Feedback from "../scaffold/Feedback"
import EditImages from "./EditImages"
import { useRouter } from "next/navigation"
import { UiContext } from "../scaffold/UiContextProvider"
import useActiveCampaign from "@/lib/useActiveCampaign"
import InfoIcon from '@mui/icons-material/Info'
import ExplainCampaignDialog from "../user/ExplainCampaignDialog"

interface Props {
    value?: Resource
    sx?: SxProps<Theme>
}

export const UPDATE_RESOURCE = gql`mutation UpdateResource($resourceId: Int, $categoryCodes: [Int], $canBeDelivered: Boolean, $canBeExchanged: Boolean, $canBeGifted: Boolean, $canBeTakenAway: Boolean, $title: String, $isService: Boolean, $isProduct: Boolean, $imagesPublicIds: [String], $expiration: Datetime, $description: String, $specificLocation: NewLocationInput = {}, $price: Int, $campaignToJoin: Int) {
  updateResource(
    input: {resourceId: $resourceId, canBeDelivered: $canBeDelivered, canBeExchanged: $canBeExchanged, canBeGifted: $canBeGifted, canBeTakenAway: $canBeTakenAway, categoryCodes: $categoryCodes, description: $description, expiration: $expiration, imagesPublicIds: $imagesPublicIds, isProduct: $isProduct, isService: $isService, title: $title, specificLocation: $specificLocation, price: $price, campaignToJoin: $campaignToJoin}
  ) {
    integer
  }
}`

export const CREATE_RESOURCE = gql`mutation CreateResource($categoryCodes: [Int], $canBeDelivered: Boolean, $canBeExchanged: Boolean, $canBeGifted: Boolean, $canBeTakenAway: Boolean, $title: String, $isService: Boolean, $isProduct: Boolean, $imagesPublicIds: [String], $expiration: Datetime, $description: String, $specificLocation: NewLocationInput = {}, $price: Int, $campaignToJoin: Int) {
    createResource(
    input: {canBeDelivered: $canBeDelivered, canBeExchanged: $canBeExchanged, canBeGifted: $canBeGifted, canBeTakenAway: $canBeTakenAway, categoryCodes: $categoryCodes, description: $description, expiration: $expiration, imagesPublicIds: $imagesPublicIds, isProduct: $isProduct, isService: $isService, title: $title, specificLocation: $specificLocation, price: $price, campaignToJoin: $campaignToJoin}
    ) {
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
    price: null,
    inActiveCampaign: false
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
    const { activeCampaign } = useActiveCampaign()
    const theme = useTheme()
    const [explainingCampaign, setExplainingCampaign] = useState(false)

    const trySave = async (value: Resource) => {
        setSaveState(beginOperation())
        if(value.id) {
            await updateResource({ variables: { resourceId: value.id, canBeDelivered: value.canBeDelivered, canBeExchanged: value.canBeExchanged, 
                canBeGifted: value.canBeGifted, canBeTakenAway: value.canBeTakenAway, categoryCodes: value.categories.map(c => c.code), 
                description: value.description, expiration: value.expiration, imagesPublicIds: value.images.map(img => img.publicId), 
                isProduct: value.isProduct, isService: value.isService, title: value.title, 
                specificLocation: value.specificLocation, price: value.price ? Number(value.price) : null,
                campaignToJoin: value.inActiveCampaign ? activeCampaign.data?.id : undefined } })
        } else {
            await createResource({ variables: { canBeDelivered: value.canBeDelivered, canBeExchanged: value.canBeExchanged, 
                canBeGifted: value.canBeGifted, canBeTakenAway: value.canBeTakenAway, categoryCodes: value.categories.map(c => c.code), 
                description: value.description, expiration: value.expiration, imagesPublicIds: value.images.map(img => img.publicId), 
                isProduct: value.isProduct, isService: value.isService, title: value.title, 
                specificLocation: value.specificLocation, price: value.price ? Number(value.price) : null,
                campaignToJoin: value.inActiveCampaign ? activeCampaign.data?.id : undefined } })
        } 
        setSaveState(fromData(undefined))
    }

    const [saveState, setSaveState] = useState<DataLoadState<undefined>>(initial(false, undefined))

    return <LoadedZone loading={profileAddress.loading || categories.loading} containerStyle={p.sx} error={profileAddress.error}>
        { categories.data && <Formik initialValues={p.value || blankResource} onSubmit={async values => {
            try {
                await trySave(values)
                router.push('.')
            } catch(e) {
                setSaveState(fromError(e, uiContext.i18n.translator('requestError')))
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
            { f => <Form onSubmit={f.handleSubmit}>
                    <Stack>
                        <Stack gap="1rem" flex="1" paddingBottom="6rem">
                            <Typography variant="body1" color="primary">{uiContext.i18n.translator('imagesLabel')}</Typography>
                            <EditImages sx={{ width: 'calc(100vw - 4rem)' }} initialValue={f.values.images.map(i => i.publicId!)}
                                onChange={(publicId, previousPublicId) => {
                                    f.setFieldValue('images', [ ...f.values.images.filter(i => i.publicId != previousPublicId), { publicId } ])
                                }}
                                onDeleteRequested={imgInfo => 
                                    f.setFieldValue('images', f.values.images.filter(i => i.publicId != imgInfo.publicId))
                                } />
                            <Stack>
                                <TextField size="small" id="title" name="title" value={f.values.title}
                                    label={uiContext.i18n.translator('titleLabel')} 
                                    onChange={f.handleChange('title')} onBlur={f.handleBlur('title')}/>
                                <ErrorMessage component={ErrorText} name="title" />
                            </Stack>
                            <Stack>
                                <TextField multiline id="description" name="description" value={f.values.description}
                                    label={uiContext.i18n.translator('descriptionLabel')} minRows={3}
                                    onChange={f.handleChange('description')} onBlur={f.handleBlur('description')}/>
                                <ErrorMessage component={ErrorText} name="description" />
                            </Stack>
                            <Stack>
                                <TextField size="small" id="price" name="price" value={f.values.price || 0}
                                    label={uiContext.i18n.translator('PriceLabel')}
                                    onChange={f.handleChange('price')} onBlur={f.handleBlur('price')}/>
                                <ErrorMessage component={ErrorText} name="price" />
                            </Stack>
                            { activeCampaign.data && <Stack direction="row" gap="0.5rem" alignItems="center">
                                <FormGroup sx={{ padding: '1rem', borderRadius: '1rem', backgroundColor: theme.palette.secondary.light }}>
                                    <FormControlLabel color={theme.palette.primary.contrastText} control={
                                        <Checkbox color="info" checked={f.values.inActiveCampaign} onChange={() => f.setFieldValue('inActiveCampaign', !f.values.inActiveCampaign)} onBlur={f.handleBlur('inActiveCampaign')} />} 
                                        label={`${uiContext.i18n.translator('resourceConformsToCampaign')}: '${activeCampaign.data.name}'`} />
                                </FormGroup>
                                <IconButton onClick={() => setExplainingCampaign(true)}>
                                    <InfoIcon />
                                </IconButton>
                            </Stack> }
                            <Stack>
                                <OptionLine sx={{ margin: 0 }} labels={{ 
                                    title: uiContext.i18n.translator('natureOptionsLabel'), 
                                    isProduct: 'isProduct',
                                    isService: 'isService'
                                }} values={{ isProduct: f.values.isProduct, isService: f.values.isService }}
                                    onChange={val => { 
                                        Object.entries(val).forEach(v => f.setFieldValue(v[0], v[1]))
                                    }}/>
                                <ErrorMessage component={ErrorText} name="isProduct" />
                            </Stack>
                            <Stack>
                                <Stack direction="row" alignItems="center" gap="1rem">
                                    <Typography variant="body1" sx={{ flex: '0 0 7rem' }} color="primary">{uiContext.i18n.translator('expirationFieldLabel')}</Typography>
                                    <FormControlLabel sx={{
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
                            </Stack>
                            <Stack>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Typography variant="body1" sx={{ flex: '0 0 7rem' }} color="primary">{uiContext.i18n.translator('categoriesLabel')}</Typography>
                                    <IconButton onClick={() => setEditedCategories(f.values.categories)}><Edit/></IconButton>
                                    <Typography variant="body1" sx={{ flex: 1, cursor: 'pointer' }} color="primary" onClick={() => setEditedCategories(f.values.categories)}>{f.values.categories.length === 0 ? uiContext.i18n.translator('noCategorySelectedLabel') : f.values.categories.map(cat => cat.name).join(', ')}</Typography>
                                </Stack>
                                <ErrorMessage component={ErrorText} name="categories" />
                            </Stack>
                            <Stack>
                                <OptionLine sx={{ margin: 0 }} labels={{ 
                                    title: uiContext.i18n.translator('exchangeTypeOptionsLabel'),
                                    canBeGifted: 'canBeGifted',
                                    canBeExchanged: 'canBeExchanged'
                                }} values={{ canBeGifted: f.values.canBeGifted, canBeExchanged: f.values.canBeExchanged }}
                                    onChange={val => { 
                                        Object.entries(val).forEach(v => f.setFieldValue(v[0], v[1]))
                                    }}/>
                                <ErrorMessage component={ErrorText} name="canBeGifted" />
                            </Stack>
                            <Stack>
                                <OptionLine sx={{ margin: 0 }} labels={{ 
                                    title: uiContext.i18n.translator('deliveryOptionsLabel'),
                                    canBeTakenAway: f.values.isProduct ? 'canBeTakenAway' : 'onSite',
                                    canBeDelivered: f.values.isProduct ? 'canBeDelivered': 'placeToBeAgreed'
                                }} values={{ canBeTakenAway: f.values.canBeTakenAway, canBeDelivered: f.values.canBeDelivered }}
                                    onChange={val => { 
                                        Object.entries(val).forEach(v => f.setFieldValue(v[0], v[1]))
                                    }}/>
                                <ErrorMessage component={ErrorText} name="canBeTakenAway" />
                            </Stack>
                            <Stack>
                                <Typography variant="body1" color="primary">{uiContext.i18n.translator('addressEditTitle')}</Typography>
                                <Stack alignItems="center">
                                    <EditAddress value={f.values.specificLocation}
                                        onChange={newLoc => f.setFieldValue('specificLocation', newLoc)} />
                                </Stack>
                                <ErrorMessage component={ErrorText} name="specificLocation" />
                            </Stack>
                        </Stack>
                        <Stack padding="1rem 2rem" sx={theme => ({ bottom: 0, left: 0, position: 'fixed', width: '100%', backgroundColor: alpha(theme.palette.secondary.main, 0.5) })} >
                            <Feedback severity="error" visible={!!saveState.error}
                                onClose={() => setSaveState(initial(false, undefined))}
                                detail={saveState.error?.detail} />
                            { f.submitCount > 0 && !f.isValid && <Stack alignItems="center">
                                <ErrorText>{uiContext.i18n.translator('someValuesInvalid')}</ErrorText>
                            </Stack> }
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
                    
                </Form>}
        </Formik> }
        <ExplainCampaignDialog explainOnly visible={explainingCampaign} onClose={() => setExplainingCampaign(false)} />
    </LoadedZone>
}

export default EditResource