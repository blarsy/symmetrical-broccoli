import { Stack, Typography } from "@mui/material"
import { DateTimePicker } from "@mui/x-date-pickers"
import dayjs from "dayjs"

interface DatetimeFieldProps {
    label: string
    value: Date
    onChange: (newDate: Date) => void
}

const DatetimeField = (p: DatetimeFieldProps) => <Stack direction="row" alignItems="flex-start" gap="1rem">
    <Typography variant="body1" sx={{ flex: '0 0 7rem' }} color="primary">{p.label}</Typography>
    <DateTimePicker closeOnSelect defaultValue={dayjs()} disablePast
        label={p.label} value={dayjs(p.value)} 
        onChange={(e: any) => {
            p.onChange(e?.toDate())
        }} />
</Stack>

export default DatetimeField