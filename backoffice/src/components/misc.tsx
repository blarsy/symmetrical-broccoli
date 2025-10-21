import Check from "@mui/icons-material/Check"
import Close from "@mui/icons-material/Close"
import Delete from "@mui/icons-material/Delete"
import Edit from "@mui/icons-material/Edit"
import EmptyImage from '@/app/img/PHOTOS.svg'
import { Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Stack, SxProps, Theme, Tooltip, Typography, useTheme } from "@mui/material"
import { PropsWithChildren } from "react"
import { urlFromPublicId } from "@/lib/images"
import Tokens from '@/app/img/TOKENS.svg'

export const screenSizesCoefficients = [0.8, 0.7, 0.5]
export const makePxSize = (baseSize: number, coeff?: number) => `${(baseSize * (coeff || 1)).toFixed(2)}px`

export const ErrorText= (props: PropsWithChildren) => {
    return <Typography textAlign="center" variant="body1" sx={{ color: 'red' }}>{props.children}</Typography>
}

interface RightAlignedModifyButtonsProps {
    editing: boolean
    onEditRequested: () => void
    saveButtonDisabled: boolean
    onSave: () => void
    onDelete?: () => void
    onCancelEdit?: () => void
}

export const RightAlignedModifyButtons = (p: RightAlignedModifyButtonsProps) => <Stack sx={{ position: 'absolute', flexDirection: 'row', right: '14px', bottom: p.editing ? '13px' : '14px', gap: '3px' }}>
    { !p.editing && <IconButton onClick={p.onEditRequested}><Edit/></IconButton> }
    { p.editing && [
        <IconButton key="save" color="primary" disabled={p.saveButtonDisabled} onClick={p.onSave}><Check/></IconButton>,
        <IconButton key="cancel" color="primary" onClick={p.onCancelEdit}><Close/></IconButton>
    ] }
    { p.onDelete && !p.editing && <IconButton onClick={p.onDelete}><Delete/></IconButton>}
</Stack>

interface ConfirmDialogProps {
    title: string
    onClose: (response: boolean) => void
    visible: boolean
    text?: string
    okButtonCaption?: string
    cancelButtonCaption?: string
    testID?: string
}

export const ConfirmDialog = (p: ConfirmDialogProps) => {
    return <Dialog open={p.visible} disableScrollLock>
        <DialogTitle>{p.title}</DialogTitle>
        { p.text && <DialogContentText sx={{ padding: '1rem' }}>{p.text}</DialogContentText>}
        <DialogActions sx={{ justifyContent: 'center' }}>
            { p.okButtonCaption ?  
                <Button data-testid={`${p.testID}:ConfirmDialog:ConfirmButton`} color="success" endIcon={<Check />} onClick={() => p.onClose(true)}>{p.okButtonCaption}</Button>
                : 
                <IconButton data-testid={`${p.testID}:ConfirmDialog:ConfirmButton`} color="success" onClick={() => p.onClose(true)}><Check /></IconButton>
            }
            { p.cancelButtonCaption ?  
                <Button color="error" endIcon={<Close />} onClick={() => p.onClose(false)}>{p.cancelButtonCaption}</Button>
                : 
                <IconButton color="error" onClick={() => p.onClose(false)}><Close /></IconButton>
            }
            
        </DialogActions>
    </Dialog>
}

export const FieldTitle = ({ title, sx }: { title: string, sx?: SxProps<Theme> }) => <Typography color="primary" 
    sx={{ position: 'relative', left: '14px', fontSize: '0.75rem', top: '-10px', ...sx }} 
    variant="body1">
        {title}
</Typography>

interface ResponsiveImageProps {
    publicId?: string
    baseSize?: number
    sx?: SxProps<Theme>
    onClick?: () => void
}

export const ResponsiveImage = (p: ResponsiveImageProps) => {
    const theme = useTheme()

    return <ResponsivePhotoBox sx={p.sx} baseSize={p.baseSize}>
        <Stack sx={{ cursor: p.onClick && 'pointer' }}>
        { p.publicId ? 
            <img style={{ borderRadius: '10px', width: '100%', height: '100%' }} alt="resource" 
                src={urlFromPublicId(p.publicId)} onClick={p.onClick}/>
            :
            <EmptyImage fill={theme.palette.primary.main} width="100%"/>
        }
        </Stack>
    </ResponsivePhotoBox>
}

interface ResponsivePhotoBoxProps extends PropsWithChildren {
    baseSize?: number
    sx?: SxProps<Theme>
}

export const ResponsivePhotoBox = (p: ResponsivePhotoBoxProps) => {
    const actualBaseSize = p.baseSize || 210

    return <Box sx={[theme => ({
            alignContent: 'center',
            height: makePxSize(actualBaseSize, 1),
            width: makePxSize(actualBaseSize, 1),
            [theme.breakpoints.down('lg')]: {
                height: makePxSize(actualBaseSize, screenSizesCoefficients[0]),
                width: makePxSize(actualBaseSize, screenSizesCoefficients[0])
            },
            [theme.breakpoints.down('md')]: {
                height: makePxSize(actualBaseSize, screenSizesCoefficients[1]),
                width: makePxSize(actualBaseSize, screenSizesCoefficients[1])
            },
            [theme.breakpoints.down('sm')]: {
                height: makePxSize(actualBaseSize, screenSizesCoefficients[2]),
                width: makePxSize(actualBaseSize, screenSizesCoefficients[2])
            },
        }), ...(Array.isArray(p.sx) ? p.sx : [p.sx])]}>
        { p.children }
    </Box>
}

const makeAvatarLetters = (name: string) =>
    name.split(/[ -]/, 2).map(word => word[0]).join('').toLocaleUpperCase()

interface AccountAvatarProps {
    name: string
    avatarImagePublicId?: string
    avatarImageUrl?: string
    sx?: SxProps<Theme>
    onClick?: () => void
}

export const AccountAvatar = ({name, avatarImagePublicId, avatarImageUrl, sx, onClick}: AccountAvatarProps) => {
    let avatar: JSX.Element
    let clickableSx: SxProps<Theme> = theme => ({
        '&:hover': {
            border: `2px solid ${theme.palette.primary.main}`
        }
    })

    const avatarSx : SxProps<Theme>= [{ width: '100%', height: '100%', cursor: onClick && 'pointer' }, 
        ...(Array.isArray(sx) ? sx : [sx]), 
        onClick ? clickableSx : {}]

    if(avatarImagePublicId) {      
        avatar = <Avatar sx={avatarSx} 
            src={urlFromPublicId(avatarImagePublicId)} alt={name} />
    } else if(avatarImageUrl) {
        avatar = <Avatar sx={avatarSx} 
            src={avatarImageUrl} alt={name} />
    } else {
        avatar = <Avatar sx={avatarSx} 
            alt={name}>{makeAvatarLetters(name)}</Avatar>
    }
    if(onClick) {
        return <Stack onClick={e => {
            e.stopPropagation()
            onClick()
        }}>
            {avatar}
        </Stack>
    }
    return avatar
}

export const PriceTag = ({ value, label, big, testID }: { value: number, label?: string, big?: boolean, testID?: string }) => {
    return <Tooltip title={`${value} Topes = ${value / 100} Euro`}>
        <Stack direction="row" gap="1rem" alignItems="center">
            { label && <Typography color="primary" sx={{ fontWeight: 'bold' }} variant="body1">{label}</Typography> }
            <Typography data-testid={testID} color="primary" sx={{ fontSize: big ? '1.5rem': '1rem' }} variant="h6">{value}</Typography>
            <Tokens style={{ width: big ? '3rem' : '2rem', height: big ? '3rem' : '2rem' }}/>
        </Stack>
    </Tooltip>
}