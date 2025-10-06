import { useContext, useState } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { Button, Stack, Typography } from "@mui/material"
import { UiContext } from "../scaffold/UiContextProvider"
import ExplainToken from "../token/ExplainToken"
import TransactionsHistory from "../token/TransactionsHistory"
import EarningTokens from "../token/EarningTokens"

const Tokens = ({version} : { version: string }) => {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    const [explainingToken, setExplainingToken] = useState(false)
    
    return <Stack sx={{ alignItems: 'center', overflow: 'auto', padding: '3px' }}>
        <Typography color="primary" variant="overline">{uiContext.i18n.translator('youHave')}</Typography>
        <Stack direction="row" gap="0.5rem">
            <Typography color="primary" variant="h2" sx={{ paddingTop: 0 }}>{appContext.account?.amountOfTokens}</Typography>
            <Typography color="primary" variant="h2" sx={{ paddingTop: 0 }}>{uiContext.i18n.translator('tokenNamePlural')}</Typography>
        </Stack>
        <Typography color="primary" variant="h4">{uiContext.i18n.translator('howTokensWork')}</Typography>
        <Button variant="contained" color="primary" onClick={() => setExplainingToken(true)}>{uiContext.i18n.translator('showMeButtonLabel')}</Button>
        <Typography color="primary" variant="h4">{uiContext.i18n.translator('howToEarnTitle')}</Typography>
        <EarningTokens version={version} />
        <Typography color="primary" variant="h4">{uiContext.i18n.translator('tokenHistoryTitle')}</Typography>
        <TransactionsHistory />
        <ExplainToken visible={explainingToken} onClose={() => setExplainingToken(false)} />
    </Stack>
}

export default Tokens