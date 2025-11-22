import { lightPrimaryColor } from "@/utils"
import { Chip, Stack, SxProps, Theme } from "@mui/material"
import { useContext } from "react"
import { UiContext } from "../scaffold/UiContextProvider"

interface ChipData {
    [name: string]: {
        i18nText?: string
        text?:string
        selected: boolean
    }
}

interface Props {
    options: ChipData
    onChange: (newVal: ChipData) => void
    onDelete?: (name: string) => void
}

const ChipList = (p: Props) => {
    const uiContext = useContext(UiContext)
    const t = uiContext.i18n.translator

    return Object.entries(p.options).map(([name, value]) =>
        <Chip onDelete={p.onDelete && (() => p.onDelete!(name))} key={name} label={value.text || t(value.i18nText!)} 
            sx={{ color: value.selected ? lightPrimaryColor: undefined }} 
            color={value.selected ? 'primary' : undefined} 
            variant={value.selected ? 'filled' : 'outlined'} 
            onClick={() => {
                const newVal = {...p.options}
                newVal[name].selected = !p.options[name].selected
                p.onChange(newVal)
            }} 
        />)
}

interface ToggledChipListProps {
    options: { [name: string]: boolean }
    onChange: (newVal: { [name: string]: boolean }) => void
}

export const ToggledChipList = (p: ToggledChipListProps) => {
    const toggleOptions = {} as ChipData
    Object.entries(p.options).forEach(opt => {
        toggleOptions[opt[0]] = { i18nText: opt[0], selected: opt[1] }
    })
    return <ChipList options={toggleOptions} onChange={newVal => {
        const converted = {} as { [name: string]: boolean }
        Object.entries(newVal).forEach(opt => { converted[opt[0]] = opt[1].selected })
        p.onChange(converted)
    }} />
}

export interface EditableChipListOptions {
    [code: string]: string
}

interface EditableChipListProps {
    options: EditableChipListOptions
    onEditRequested: () => void
    sx: SxProps<Theme> | undefined
    onDeleteRequested: (name: string) => void
}

export const EditableChipList = (p: EditableChipListProps) => {
    const chipOptions = {} as ChipData
    Object.entries(p.options).forEach(opt => chipOptions[opt[0]] = { text: opt[1], selected: true })

    return <Stack direction="row" sx={p.sx}>
        <ChipList onDelete={p.onDeleteRequested} options={chipOptions} onChange={() => {}} />
        <Chip label="..." onClick={p.onEditRequested} />
    </Stack>
}