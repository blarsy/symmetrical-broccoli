import React, { useContext, useEffect, useMemo, useState } from "react"
import { Box, Dialog, DialogTitle, IconButton, Stack, TextField, Typography, useTheme } from "@mui/material"
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'
import { UiContext } from "../scaffold/UiContextProvider"
import { getPercentFromValue } from "@/lib/utils"

interface PriceGradientBarProps {
  percent: number
  barHeight?: number
  onPercentChanged?: (percent: number) => void
  coarse?: boolean
}

export const PriceGradientBar = ({ percent, barHeight = 16, onPercentChanged, coarse }: PriceGradientBarProps) => {
  const theme = useTheme()
  const contrastTextColor = theme.palette.getContrastText(theme.palette.background.paper)
  const [isDragging, setIsDragging] = useState(false)
  
  const handleCoarse = (p: number) => {
    if(coarse) {
      if(p <= 25) return 12.5
      if(p <= 50) return 37.5
      if(p <= 75) return 62.5
      if(p <= 100) return 87.5
    }
    return p
  }
  
  const displayPercent = handleCoarse(Math.max(0, Math.min(100, percent)))
  const toPercent = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const p = Math.min(100, Math.max(0, (x / rect.width) * 100))

    return handleCoarse(p)
  }

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    setIsDragging(true)
    const p = toPercent(event)
    onPercentChanged?.(p)
  }

  const handleMouseUp = () => setIsDragging(false)
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!isDragging) return
    const p = toPercent(event)
    onPercentChanged?.(p)
  }

  return (
    <Box
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onMouseMove={handleMouseMove}
      sx={{
        width: '100%',
        position: 'relative',
        cursor: 'pointer',
        height: barHeight + 14 // make room for the chevron below the bar
      }}
    >
      <Box
        sx={{
          width: '100%',
          height: barHeight,
          borderRadius: '999px',
          border: '1px solid rgba(0,0,0,.2)',
          overflow: 'hidden',
          background: 'linear-gradient(90deg, #fef0e3 0%, #fef0e3 25%, #ffb873 25%, #ffb873 50%, #ff770c 50%, #ff770c 75%, #ff4401 75%, #ff4401 100%)'
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: `${displayPercent}%`,
          top: 0,
          transform: 'translate(-50%, 0)',
          pointerEvents: 'none',
          width: 2,
          height: barHeight + 8,
          backgroundColor: contrastTextColor
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          left: `${displayPercent}%`,
          top: barHeight + 4,
          transform: 'translate(-50%, 0)',
          pointerEvents: 'none',
          color: contrastTextColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <ArrowDropUpIcon fontSize="medium" />
      </Box>
    </Box>
  )
}

export const getValueFromPercent = (percent: number) => {
  if (percent <= 25) return Math.round(percent * 4)
  if (percent <= 50) return Math.round((percent - 25) * 36 + 100)
  if (percent <= 75) return Math.round((percent - 50) * 160 + 1000)
  return Math.round((percent - 75) * 200 + 5000)
}

const getI18nFromPercent = (value: number) => {
  if (value <= 25) return 'priceLegUp'
  if (value <= 50) return 'priceFavor'
  if (value <= 75) return 'priceCommitment'
  return 'pricePrecious'
}

const getRangeI18nFromPercent = (value: number) => {
  if (value <= 25) return 'priceLegUpRange'
  if (value <= 50) return 'priceFavorRange'
  if (value <= 75) return 'priceCommitmentRange'
  return 'pricePreciousRange'
}

interface PriceInfoProps {
  tokenValue?: number
}

export const PriceInfo = ({ tokenValue }: PriceInfoProps) => {
  const uiContext = useContext(UiContext)
  const [encodedPercent, setEncodedPercent] = useState(() => getPercentFromValue(tokenValue ?? 0))
  
  return (
    <Stack gap="1rem">
      <PriceGradientBar coarse percent={encodedPercent} onPercentChanged={setEncodedPercent}/>
      <Typography variant="body2" color="text.secondary">{uiContext.i18n.translator(getRangeI18nFromPercent(encodedPercent))}</Typography>
      <Typography variant="body2" color="text.secondary">{uiContext.i18n.translator(getI18nFromPercent(encodedPercent))}</Typography>
    </Stack>
  )
}

interface PriceSetterProps {
  value?: number
  onChange: (value: number) => void
  onBlur: (e: any) => void
  label: string
}

export const PriceSetter = ({ value = 0, onChange, onBlur, label }: PriceSetterProps) => {
  const [percent, setPercent] = useState(getPercentFromValue(value))
  const [valueInput, setValueInput] = useState(value)
  const uiContext = useContext(UiContext)

  useEffect(() => {
    setPercent(getPercentFromValue(value))
  }, [value])

  const onPercentChanged = (p: number) => {
    const clipped = Math.max(0, Math.min(100, p))
    setPercent(clipped)
    const newValue = getValueFromPercent(clipped)
    setValueInput(newValue)
    onChange(newValue)
  }

  return (
    <Stack gap="0.5rem">
        <TextField size="small" id="price" name="price" value={valueInput}
            label={label}
            onChange={e => {
              const newValue = isNaN(Number(e.target.value)) ? 0 : Number(e.target.value)
              setValueInput(newValue)
              onChange(newValue)
            }} onBlur={onBlur}/>
        <PriceGradientBar percent={percent} onPercentChanged={onPercentChanged} />
        <Typography variant="body2" color="text.secondary">{uiContext.i18n.translator(getRangeI18nFromPercent(percent))}</Typography>
        <Typography variant="body2" color="text.secondary">{uiContext.i18n.translator(getI18nFromPercent(percent))}</Typography>

    </Stack>
  )
}

interface PriceInfoDialogProps {
    value?: number
    visible: boolean
    onClose?: () => void
}

export const PriceInfoDialog = ({ value = 0, visible, onClose }: PriceInfoDialogProps) => {
    const uiContext = useContext(UiContext)

    return <Dialog open={visible} onClose={onClose} maxWidth="md" title={uiContext.i18n.translator('topeValueTitle')} fullWidth>
        <Stack gap="1rem" padding="1.5rem" onClick={e => { e.stopPropagation() }}>
            <Typography color="primary" variant="h2">{uiContext.i18n.translator('topeValueTitle')}</Typography>
            <Typography variant="body1" color="text.secondary">
                {uiContext.i18n.translator('topeValueExplanation')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
                {uiContext.i18n.translator('topeValueExplanation2')}
            </Typography>
            <PriceInfo tokenValue={value} />
        </Stack>
    </Dialog>
}
