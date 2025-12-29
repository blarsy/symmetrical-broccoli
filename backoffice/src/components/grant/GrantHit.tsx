import { gql, useMutation, useQuery } from "@apollo/client"
import { Stack, Typography } from "@mui/material"
import LoadedZone from "../scaffold/LoadedZone"
import { Key, useContext, useEffect } from "react"
import { UiContext } from "../scaffold/UiContextProvider"
import Feedback from "../scaffold/Feedback"
import { AppContext } from "../scaffold/AppContextProvider"
import { PriceTag } from "../misc"

interface Props {
    grantId: string
}

const GRANT_HIT = gql`mutation GrantHit($grantId: UUID) {
  grantHit(input: {grantId: $grantId}) {
    integer
  }
}`

const GET_GRANT_BY_UID = gql`query GetGrantByUid($uid: UUID) {
  getGrantByUid(uid: $uid) {
    amount
    description
    title
    expiration
  }
}`

const getI18nForGrantHitError = (errorCode: number, translator: (str: string[] | Key | Key[], opts?: any) => string, email: string) => {
    switch(errorCode) {
        case -1:
            return translator('grantExpired')
        case -3:
            return translator('maxNumerOfGrantsReached')
        case -3:
            return translator('notOnWhiteList', { email })
        case -4:
            return translator('notAParticipantToTheConfiguredCampaign')
        default:
            return translator('requestError')
    }
}

const GrantHit = ({ grantId }: Props) => {
    const uiContext = useContext(UiContext)
    const appContext = useContext(AppContext)
    const { data, loading, error } = useQuery(GET_GRANT_BY_UID, { variables: { uid: grantId } })
    const [grantHit, { data: hitData, loading: hitProcessing, error: hitError }] = useMutation(GRANT_HIT)

    useEffect(() => {
        if(appContext.account)
            grantHit({ variables: { uid: grantId } })
    }, [appContext.account])

    return <LoadedZone loading={loading} error={error}>
        { data && <Stack>
            <Typography variant="h1">{`${uiContext.i18n.translator('grantTitle')} : ${data.getGrantByUid.title}`}</Typography>
            <Typography variant="body1">{data.getGrantByUid.description}</Typography>
            <LoadedZone loading={hitProcessing} error={hitError}>
                { hitData.grantHit.integer === 1 ?
                    <Stack>
                        <PriceTag value={data.getGrantByUid.amount} big label={uiContext.i18n.translator('youWon')} />
                        <Feedback severity="success" message={uiContext.i18n.translator('grantSucceeded', { amount: data.getGrantByUid.amount })} />
                    </Stack>
                : <Feedback severity="error" message={uiContext.i18n.translator(getI18nForGrantHitError(hitData.grantHit.integer, uiContext.i18n.translator, appContext.account!.email))} /> }
            </LoadedZone>
        </Stack> }
    </LoadedZone>
}

export default GrantHit