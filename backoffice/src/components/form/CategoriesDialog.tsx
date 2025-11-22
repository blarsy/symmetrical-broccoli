import { Category } from "@/lib/schema"
import { useContext, useState } from "react"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material"
import CategoriesSelector from "./CategoriesSelector"
import { UiContext } from "../scaffold/UiContextProvider"

interface Props {
    visible: boolean
    onClose: (cats?: Category[]) => void
    value: Category[]
}

const CategoriesDialog = (p: Props) => {
    const uiContext = useContext(UiContext)
    const [currentCategories, setCurrentCategories] = useState<Category[]>(p.value)

    return <Dialog maxWidth="xl" open={p.visible} onClose={() => p.onClose()}>
        <DialogTitle>{uiContext.i18n.translator('selectCategoriesDialogTitle')}</DialogTitle>
        <DialogContent sx={{ width: '100%', height: '100vh' }}>
            <CategoriesSelector values={p.value.map(c => c.code)} 
                onSelectionChanged={e => {
                    setCurrentCategories(
                        e.map(catCode => uiContext.categories.data!.find(cat => cat.code === catCode)!)
                    )
                }} />
        </DialogContent>
        <DialogActions>
            <Button onClick={ () => p.onClose() }>{uiContext.i18n.translator('cancelButton')}</Button>
            <Button disabled={currentCategories.length === 0} onClick={() => {
                p.onClose(currentCategories)
            }}>{uiContext.i18n.translator('okButton')}</Button>
        </DialogActions>
    </Dialog>
}

export default CategoriesDialog