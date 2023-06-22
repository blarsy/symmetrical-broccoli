import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, IconButton } from "@mui/material"
import CloseIcon from '@mui/icons-material/Close'
import { useState } from "react"
import SimpleDialogDemo from "./TestDialog"

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

const ImageShower = ({ open, onClose, image }: ShowerProps) => {
    return <Dialog  
        open={open}
        onClose={onClose}>
        <DialogContent>
            <DialogContentText>{image}</DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose}>Fermer</Button>
        </DialogActions>
    </Dialog>
}

const EnlargableImage = ({ title, path, size, onDeleteRequested }: Props) => {
    const [open, setOpened] = useState(false)

    return <Box key={title} sx={{ position: 'relative', cursor: 'pointer' }}
        onClick={() => {
            setOpened(true)
        }}>
        <IconButton sx={{ position: "absolute", right: 0, top: 0, 
            zIndex: 10, backgroundColor: '#FFF', color: '#000', 
            ':hover': {backgroundColor: '#DDD', color: '#222'} }}
            onClick={(e) => {
                e.preventDefault()
                onDeleteRequested()
            }}>
            <CloseIcon />
        </IconButton>
        <img width={size} src={path} alt={title} />

        <SimpleDialogDemo />
        {/* <ImageShower image={<img src={path} alt={title} />} onClose={() => {
            setOpened(false)
        }} open={open} /> */}
    </Box>
}

export default EnlargableImage