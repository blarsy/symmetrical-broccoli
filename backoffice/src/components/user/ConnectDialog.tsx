import { Dialog, DialogContent, DialogTitle } from "@mui/material"
import { useContext } from "react"
import { AppContext  } from "../scaffold/AppContextProvider"
import ConnectForm from "./ConnectForm"

interface Props {
    visible: boolean
    onClose: () => void
    version: string
}

const ConnectDialog = (p: Props) => {
    const appContext = useContext(AppContext)
    const t = appContext.i18n.translator

    return <Dialog open={p.visible}>
        <DialogTitle>{t('connectDialogTitle')}</DialogTitle>
        <DialogContent>
            <ConnectForm version={p.version} onClose={p.onClose}/>
        </DialogContent>
    </Dialog>
}

export default ConnectDialog