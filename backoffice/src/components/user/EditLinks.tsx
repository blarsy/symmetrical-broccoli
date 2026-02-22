import { Link, LinkTypes } from "@/lib/schema"
import { Box, Button, IconButton, Popover, Stack, TextField, Typography } from "@mui/material"
import { useContext, useState } from "react"
import FacebookIcon from '@mui/icons-material/Facebook'
import InstagramIcon from '@mui/icons-material/Instagram'
import TwitterIcon from '@mui/icons-material/Twitter'
import WebsiteIcon from '@mui/icons-material/Web'
import PlusIcon from '@mui/icons-material/Add'
import { ConfirmDialog, ErrorText, FieldTitle, RightAlignedModifyButtons } from "../misc"
import { ErrorMessage, Formik } from "formik"
import * as yup from "yup"
import DataLoadState, { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { UiContext } from "../scaffold/UiContextProvider"
import { error } from "@/lib/logger"
import { AppContext } from "../scaffold/AppContextProvider"

interface LinkIconEditProps {
    value: LinkTypes
    onChange: (newVal: LinkTypes) => void
}

const LinkIconEdit = (p: LinkIconEditProps) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

    const handleSelectType = (newType: LinkTypes) => {
        p.onChange(newType)
        setAnchorEl(null)
    }

    return <>
        <IconButton onClick={e => setAnchorEl(e.currentTarget)}>
            <LinkIcon value={p.value}/>
        </IconButton>
        <Popover
            open={!!anchorEl}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'center',
            }} transformOrigin={{
                vertical: 'bottom',
                horizontal: 'center'
            }} disableScrollLock>
            <Stack direction="column" padding="0.5rem">
                <IconButton onClick={() => handleSelectType(LinkTypes.facebook)}>
                    <FacebookIcon color="primary" />
                </IconButton>
                <IconButton onClick={() => handleSelectType(LinkTypes.instagram)}>
                    <InstagramIcon color="primary" />
                </IconButton>
                <IconButton onClick={() => handleSelectType(LinkTypes.twitter)}>
                    <TwitterIcon color="primary" />
                </IconButton>
                <IconButton onClick={() => handleSelectType(LinkTypes.web)}>
                    <WebsiteIcon color="primary" />
                </IconButton>
            </Stack>
        </Popover>
    </>
}

const LinkIcon = ({ value }: { value: LinkTypes}) => {
    switch(value) {
        case LinkTypes.facebook:
            return <FacebookIcon color="primary" />
        case LinkTypes.instagram:
            return <InstagramIcon color="primary" />
        case LinkTypes.twitter:
            return <TwitterIcon color="primary" />
        case LinkTypes.web:
            return <WebsiteIcon color="primary" />
    }
}

interface Props {
    links: Link[]
    onDone: (newLinks: Link[]) => Promise<void>
}

const EditLinks = (p: Props) => {
    const uiContext = useContext(UiContext)
    const appContext = useContext(AppContext)
    const [editedLinks, setEditedLinks] = useState<number[]>([])
    const [currentLinks, setCurrentLinks] = useState<Link[]>(p.links)
    const [linkToDelete, setLinkToDelete] = useState<number | null>(null)
    const [deleteLinkState, setDeleteLinkState] = useState<DataLoadState<undefined>>(initial(false, undefined))

    return <Stack padding="5px">
        <FieldTitle title={uiContext.i18n.translator('linksEditTitle')} />
        <Button startIcon={<PlusIcon/>} onClick={() => {
            setCurrentLinks([ ...currentLinks, { id: 0, label: '', url: '', type: LinkTypes.web } ])
            setEditedLinks([...editedLinks, currentLinks.length])
        }}>{uiContext.i18n.translator('addLinkButtonCaption')}</Button>

        { currentLinks.map((link, idx) => {
            return <Formik key={idx} initialValues={{...link, ...{ index: idx }}} validationSchema={yup.object().shape({
                label: yup.string(),
                url: yup.string().url(uiContext.i18n.translator('mustBeWellFormedURL')).required(uiContext.i18n.translator('required_field'))
            })} onSubmit={values => {
                const newLinks = [...currentLinks]
                newLinks[idx] = values
                setCurrentLinks(newLinks)
                setEditedLinks(prev => prev.filter(val => val !== idx))
                setTimeout(() => p.onDone(newLinks), 0)
            }}>
                {f => <Stack direction="row" gap="1rem" alignItems="center" justifyContent="stretch" paddingLeft="14px" paddingRight="7rem" sx={{ position: 'relative' }}>
                    { editedLinks.find(val => val === idx) != undefined ?
                        [  <LinkIconEdit value={f.values.type} key="link" onChange={newVal => {
                                f.setFieldValue('type', newVal)
                            }} />,
                            <TextField key="label" sx={{ flex: 1 }} label={uiContext.i18n.translator('linkLabelLabel')}
                                color="primary" value={f.values.label} onBlur={f.handleBlur('label')} 
                                onChange={f.handleChange('label')} />,
                            <Stack key="url">
                                <TextField sx={{ flex: 1 }} label={uiContext.i18n.translator('linkUrlLabel')}
                                    color="primary" value={f.values.url} onBlur={f.handleBlur('url')} 
                                    onChange={f.handleChange('url')} />
                            <ErrorMessage component={ErrorText} name="url" />
                            </Stack>
                        ] : [ <Box key="link" sx={{ padding: '8px'}}><LinkIcon value={f.values.type} /></Box>,
                            <Typography key="label" sx={{ flex: 1, paddingTop: '16px', paddingBottom: '16px' }} color="primary" noWrap>{f.values.label}</Typography>,
                            <Typography key="url" sx={{ flex: 1, paddingTop: '16px', paddingBottom: '16px' }} color="primary" noWrap><a href={f.values.url} target="_blank">{f.values.url}</a></Typography>
                        ]
                    }
                    <RightAlignedModifyButtons editing={editedLinks.find(val => val === idx) != undefined } onEditRequested={() => {
                        setEditedLinks([...editedLinks, idx])
                    }} onCancelEdit={() => {
                        f.resetForm()
                        setEditedLinks(editedLinks.filter(val => val != idx))
                        if(link.id === 0) {
                            setCurrentLinks(prev => prev.filter((l, i) => idx !== i))
                        }
                    }} onSave={() => {
                            f.submitForm()
                    }}
                    onDelete={() => setLinkToDelete(idx)}
                    saveButtonDisabled={!f.dirty} />
                    <ConfirmDialog title={ uiContext.i18n.translator('confirmLinkDeletionTitle') } visible={linkToDelete != null}
                        onClose={ response => {
                            if(response) {
                                setCurrentLinks(prev => {
                                    const newLinks = prev.filter((val, i) => idx != i)
                                    setTimeout(() => {
                                        setDeleteLinkState(beginOperation())
                                        try {
                                            p.onDone(newLinks)
                                        } catch(e) {
                                            error({
                                                message: (e as Error).toString(), accountId: appContext.account?.id
                                            }, uiContext.version, true)
                                            setDeleteLinkState(fromError(e as Error, uiContext.i18n.translator('requestError')))
                                        } finally {
                                            setDeleteLinkState(fromData(undefined))
                                        }
                                    }, 0)
                                    return newLinks
                                })
                            }
                            setLinkToDelete(null)
                        } }/>
                </Stack>}
            </Formik>
        })}
    </Stack>
}

export default EditLinks