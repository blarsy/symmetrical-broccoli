import { createTheme } from "@mui/material"
import localFont from "next/font/local"
import { lightPrimaryColor } from "./utils"

const title = localFont({ src: './app/dk-magical-brush.otf' })
const general = localFont({ src: './app/futura-std-book.otf' })
const altGeneral = localFont({ src: './app/futura-std-heavy.otf' })
const sugar = localFont({ src: './app/more-sugar.regular.otf' })
export const fonts = {
  title,
  general,
  altGeneral,
  sugar
}

export default (dark: boolean) => createTheme({
  palette: {
    mode: dark ? 'dark': 'light',
    primary: {
      main: '#ff4401',
      contrastText: dark ? lightPrimaryColor : '#000',
    },
    secondary: {
      main: '#f50057',
    }
  },
  typography: {
    body1: { fontFamily: fonts.general.style.fontFamily },
    body2: { fontFamily: fonts.sugar.style.fontFamily },
    h1: {
      fontFamily: fonts.title.style.fontFamily,
      fontSize: '2.5rem', padding: '1.5rem 0'
    },
    h2: {
      fontFamily: fonts.title.style.fontFamily,
      fontSize: '2rem', padding: '1.2rem 0'
    },
    h3: {
      fontFamily: fonts.title.style.fontFamily,
      fontSize: '1.7rem', padding: '1rem 0'
    },
    h4: {
      fontFamily: fonts.title.style.fontFamily,
      fontSize: '1.4rem', padding: '0.5rem 0'
    },
    h5: {
      fontFamily: fonts.title.style.fontFamily,
      fontSize: '1.2rem', padding: '0.3rem 0'
    },
    h6: {
      fontFamily: fonts.title.style.fontFamily,
      fontSize: '1.1rem', padding: '0.2rem 0'
    },
    overline: { fontFamily: fonts.altGeneral.style.fontFamily },
    caption: { fontFamily: fonts.altGeneral.style.fontFamily },
    subtitle1: { fontFamily: fonts.title.style.fontFamily },
    subtitle2: { fontFamily: fonts.title.style.fontFamily },
    button: { fontFamily: fonts.altGeneral.style.fontFamily },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1650,
    },
  },
})