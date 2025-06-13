import { Dialog, DialogContent, DialogTitle } from "@mui/material"
import { useContext } from "react"
import { AppContext  } from "../scaffold/AppContextProvider"
import Login from "./Login"

interface Props {
    visible: boolean
    onClose: () => void
    version: string
}

const ConnectDialog = (p: Props) => {
    const appContext = useContext(AppContext)
    const t = appContext.i18n.translator

    return <Dialog open={p.visible} fullWidth>
        <DialogTitle>{t('connectDialogTitle')}</DialogTitle>
        <DialogContent>
            <Login version={p.version} onClose={p.onClose}/>
        </DialogContent>
    </Dialog>
}

export default ConnectDialog