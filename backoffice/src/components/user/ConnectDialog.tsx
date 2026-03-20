import { Dialog, DialogContent, DialogTitle } from "@mui/material"
import { useContext } from "react"
import Login from "./Login"
import { UiContext } from "../scaffold/UiContextProvider"

interface Props {
    visible: boolean
    onClose: () => void
}

const ConnectDialog = (p: Props) => {
    const uiContext = useContext(UiContext)
    const t = uiContext.i18n.translator

    return <Dialog open={p.visible} fullWidth>
        <DialogTitle>{t('connectDialogTitle')}</DialogTitle>
        <DialogContent>
            <Login onClose={p.onClose}/>
        </DialogContent>
    </Dialog>
}

export default ConnectDialog