import { Category } from "@/lib/schema"
import { useContext, useEffect, useState } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material"
import CategoriesSelector from "./CategoriesSelector"
import useCategories from "@/lib/useCategories"

interface Props {
    visible: boolean
    onClose: (cats?: Category[]) => void
    value: Category[]
}

const CategoriesDialog = (p: Props) => {
    const appContext = useContext(AppContext)
    const [currentCategories, setCurrentCategories] = useState<Category[]>(p.value)
    const categories = useCategories()

    return <Dialog maxWidth="xl" open={p.visible} onClose={() => p.onClose()}>
        <DialogTitle>{appContext.i18n.translator('selectCategoriesDialogTitle')}</DialogTitle>
        <DialogContent sx={{ width: '100%', height: '100vh' }}>
            <CategoriesSelector lang={appContext.i18n.lang} values={p.value.map(c => c.code)} 
                onSelectionChanged={e => {
                    setCurrentCategories(
                        e.map(catCode => categories.data!.find(cat => cat.code === catCode)!)
                    )
                }} />
        </DialogContent>
        <DialogActions>
            <Button onClick={ () => p.onClose() }>{appContext.i18n.translator('cancelButton')}</Button>
            <Button disabled={currentCategories.length === 0} onClick={() => {
                p.onClose(currentCategories)
            }}>{appContext.i18n.translator('okButton')}</Button>
        </DialogActions>
    </Dialog>
}

export default CategoriesDialog