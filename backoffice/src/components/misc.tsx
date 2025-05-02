import Check from "@mui/icons-material/Check"
import Close from "@mui/icons-material/Close"
import Delete from "@mui/icons-material/Delete"
import Edit from "@mui/icons-material/Edit"
import EmptyImage from '@/app/img/PHOTOS.svg'
import { Avatar, Box, Dialog, DialogActions, DialogTitle, IconButton, Stack, SxProps, Theme, Typography, useTheme } from "@mui/material"
import { PropsWithChildren } from "react"
import { urlFromPublicId } from "@/lib/images"

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
    processing: boolean
    error?: Error
}

export const ConfirmDialog = (p: ConfirmDialogProps) => {
    return <Dialog open={p.visible} disableScrollLock>
        <DialogTitle>{p.title}</DialogTitle>
        <DialogActions sx={{ justifyContent: 'center' }}>
            <IconButton color="success" onClick={() => p.onClose(true)}><Check /></IconButton>
            <IconButton color="error" onClick={() => p.onClose(false)}><Close /></IconButton>
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
    style?: SxProps<Theme>
}

export const ResponsiveImage = (p: ResponsiveImageProps) => {
    const theme = useTheme()

    return <ResponsivePhotoBox style={p.style} baseSize={p.baseSize}>
        { p.publicId ? 
        <img style={{ cursor: 'pointer', borderRadius: '10px', width: '100%' }} alt="resource" src={urlFromPublicId(p.publicId)} />
        :
        <EmptyImage fill={theme.palette.primary.main} width="100%"/> }
    </ResponsivePhotoBox>
}

interface ResponsivePhotoBoxProps extends PropsWithChildren {
    baseSize?: number
    style?: SxProps<Theme>
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
        }), ...(Array.isArray(p.style) ? p.style : [p.style])]}>
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
    if(avatarImagePublicId) {      
        avatar = <Avatar sx={[{ width: '100%', height: '100%', cursor: 'pointer' }, ...(Array.isArray(sx) ? sx : [sx])]} 
            src={urlFromPublicId(avatarImagePublicId)} alt={name} />
    } else if(avatarImageUrl) {
        avatar = <Avatar sx={[{ width: '100%', height: '100%', cursor: 'pointer' }, ...(Array.isArray(sx) ? sx : [sx])]} 
            src={avatarImageUrl} alt={name} />
    } else {
        avatar = <Avatar sx={[{ width: '100%', height: '100%', cursor: 'pointer' }, ...(Array.isArray(sx) ? sx : [sx])]} 
            alt={name}>{makeAvatarLetters(name)}</Avatar>
    }
    if(onClick) {
        return <Stack onClick={onClick}>
            {avatar}
        </Stack>
    }
    return avatar
}