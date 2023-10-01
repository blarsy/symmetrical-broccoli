import { createTheme } from "@mui/material"
import localFont from "next/font/local"
import { lightPrimaryColor, primaryColor } from "./utils"

const titleFont = localFont({ src: './app/dk-magical-brush.otf' })
const generalFont = localFont({ src: './app/futura-std-book.otf' })
const altGeneralFont = localFont({ src: './app/futura-std-heavy.otf' })

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
    h1: { fontFamily: titleFont.style.fontFamily,
      fontSize: '2.5rem', padding: '1.5rem 0' },
    h2: { fontFamily: titleFont.style.fontFamily,
      fontSize: '2rem', padding: '1.2rem 0' },
    h3: { fontFamily: titleFont.style.fontFamily,
      fontSize: '1.7rem', padding: '1rem 0' },
    h4: { fontFamily: titleFont.style.fontFamily,
      fontSize: '1.4rem', padding: '0.5rem 0' },
    h5: { fontFamily: titleFont.style.fontFamily,
      fontSize: '1.2rem', padding: '0.3rem 0' },
    h6: { fontFamily: titleFont.style.fontFamily,
      fontSize: '1.1rem', padding: '0.2rem 0' },
    overline: { fontFamily: altGeneralFont.style.fontFamily },
    caption: { fontFamily: altGeneralFont.style.fontFamily },
    subtitle1: { fontFamily: titleFont.style.fontFamily },
    subtitle2: { fontFamily: titleFont.style.fontFamily },
    button: { fontFamily: altGeneralFont.style.fontFamily },
  }
})