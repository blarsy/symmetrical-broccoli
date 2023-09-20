import { createTheme } from "@mui/material"
import localFont from "next/font/local"

const titleFont = localFont({ src: './app/dk-magical-brush.otf' })
const generalFont = localFont({ src: './app/futura-std-book.otf' })
const altGeneralFont = localFont({ src: './app/futura-std-heavy.otf' })

const primaryColor = '#ff4401'
const lightPrimaryColor = '#fef0e3'

export default createTheme({
  palette: {
    primary: {
      main: primaryColor,
    },
    secondary: {
      main: lightPrimaryColor
    }
  },
  typography: {
    body1: { fontFamily: generalFont.style.fontFamily } ,
    body2: { fontFamily: generalFont.style.fontFamily },
    h1: { fontFamily: titleFont.style.fontFamily },
    h2: { fontFamily: titleFont.style.fontFamily },
    h3: { fontFamily: titleFont.style.fontFamily },
    h4: { fontFamily: titleFont.style.fontFamily },
    h5: { fontFamily: titleFont.style.fontFamily },
    h6: { fontFamily: titleFont.style.fontFamily },
    overline: { fontFamily: altGeneralFont.style.fontFamily },
    caption: { fontFamily: altGeneralFont.style.fontFamily },
    subtitle1: { fontFamily: titleFont.style.fontFamily },
    subtitle2: { fontFamily: titleFont.style.fontFamily },
    button: { fontFamily: altGeneralFont.style.fontFamily },
  }
})