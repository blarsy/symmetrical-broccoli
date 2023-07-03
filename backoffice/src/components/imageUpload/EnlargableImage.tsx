import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, IconButton } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close'
import { Fragment, useState } from "react"

interface Props {
    onDeleteRequested: () => Promise<void>,
    title: string,
    path: string,
    size: number
}

interface ShowerProps {
    open: boolean,
    onClose: () => void,
    image: JSX.Element
}

function ImageShower ({ open, onClose, image }: ShowerProps) {
    return <Dialog  
        open={open}
        onClose={() => {
            onClose()
        }}>
        <DialogContent>
            <DialogContentText>{image}</DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => {
            onClose()
        }}>Fermer</Button>
        </DialogActions>
    </Dialog>
}

function EnlargableImage ({ title, path, size, onDeleteRequested }: Props) {
    const [open, setOpen] = useState(false)
    return <Fragment>
        <Box key={title} sx={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => {
                setOpen(true)
            }}>
            <IconButton sx={{ position: "absolute", right: 0, top: 0, 
                zIndex: 10, backgroundColor: '#FFF', color: '#000', 
                ':hover': {backgroundColor: '#DDD', color: '#222'} }}
                onClick={(e) => {
                    e.stopPropagation()
                    onDeleteRequested()
                }}>
                <CloseIcon />
            </IconButton>
            <img width={size} src={path} alt={title} />
        </Box>
        <ImageShower image={<img src={path} alt={title} width="100%"/>} onClose={() => {
            setOpen(false)
        }} open={open} />
    </Fragment>

}

export default EnlargableImage