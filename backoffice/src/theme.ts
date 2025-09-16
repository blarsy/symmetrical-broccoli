import { createTheme } from "@mui/material"
import localFont from "next/font/local"
import { lightPrimaryColor } from "./utils"

const title = localFont({ src: './app/DSMarkerFelt.ttf' })
const general = localFont({ src: './app/Jost-VariableFont_wght.ttf' })
const altGeneral = localFont({ src: './app/Jost-VariableFont_wght.ttf', weight: "800" })
const sugar = localFont({ src: './app/ComicJensFreePro-Regular.ttf' })
export const fonts = {
  title,
  general,
  altGeneral,
  sugar
}

const BIGGEST_TITLE_FONT_SIZE = 2.5
const TITLE_SIZE_RATIOS = [1, 0.8, 0.65, 0.55, 0.45, 0.4]

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
      padding: '1.5rem 0',
      fontWeight: 800,
      textTransform: 'uppercase',
      fontStretch: 'expanded',
      fontSize: `${BIGGEST_TITLE_FONT_SIZE * TITLE_SIZE_RATIOS[0]}rem`
    },
    h2: {
      fontFamily: fonts.title.style.fontFamily,
      fontSize: `${BIGGEST_TITLE_FONT_SIZE * TITLE_SIZE_RATIOS[1]}rem`, padding: '1.2rem 0'
    },
    h3: {
      fontFamily: fonts.title.style.fontFamily,
      fontSize: `${BIGGEST_TITLE_FONT_SIZE * TITLE_SIZE_RATIOS[2]}rem`, padding: '1rem 0'
    },
    h4: {
      fontFamily: fonts.title.style.fontFamily,
      fontSize: `${BIGGEST_TITLE_FONT_SIZE * TITLE_SIZE_RATIOS[3]}rem`, padding: '0.5rem 0'
    },
    h5: {
      fontFamily: fonts.title.style.fontFamily,
      fontSize: `${BIGGEST_TITLE_FONT_SIZE * TITLE_SIZE_RATIOS[4]}rem`, padding: '0.3rem 0'
    },
    h6: {
      fontFamily: fonts.title.style.fontFamily,
      fontSize: `${BIGGEST_TITLE_FONT_SIZE * TITLE_SIZE_RATIOS[5]}rem`, padding: '0.2rem 0'
    },
    overline: { fontFamily: fonts.general.style.fontFamily },
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