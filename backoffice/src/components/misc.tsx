import Check from "@mui/icons-material/Check"
import Close from "@mui/icons-material/Close"
import Delete from "@mui/icons-material/Delete"
import Edit from "@mui/icons-material/Edit"
import { Dialog, DialogActions, DialogTitle, IconButton, Stack, SxProps, Theme, Typography } from "@mui/material"
import { PropsWithChildren } from "react"

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