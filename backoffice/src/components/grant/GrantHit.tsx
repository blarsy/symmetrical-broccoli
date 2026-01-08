import { gql, useMutation, useQuery } from "@apollo/client"
import { Stack, Typography } from "@mui/material"
import LoadedZone from "../scaffold/LoadedZone"
import { Key, useContext, useEffect, useState } from "react"
import { UiContext } from "../scaffold/UiContextProvider"
import Feedback from "../scaffold/Feedback"
import { AppContext } from "../scaffold/AppContextProvider"
import { PriceTag } from "../misc"

interface Props {
    grantId: string
}

export const GRANT_HIT = gql`mutation GrantHit($grantId: UUID) {
  grantHit(input: {grantId: $grantId}) {
    integer
  }
}`

export const GET_GRANT_BY_UID = gql`query GetGrantByUid($uid: UUID) {
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
        case -2:
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
    const [hitDone, setHitDone] = useState(false)

    useEffect(() => {
        if(appContext.account && data && data.getGrantByUid && !hitDone){
            // it's necessary to track the fact a hit has already been attempted, because when we don't:
            // - hit is done with success
            // - that sends an account_changed event throught the subscription
            // - which rerender the whole app, replaying the hit (which fails, because it has already been awarded on the account)
            setHitDone(true)
            grantHit({ variables: { grantId } })
        }
    }, [data])

    return <LoadedZone loading={loading} error={error}>
        { data && data.getGrantByUid ? <Stack gap="0.5rem">
            <Typography data-testid="GrantTitle" variant="h1" textAlign="center">{`${uiContext.i18n.translator('grantTitle')} : ${data.getGrantByUid.title}`}</Typography>
            <Typography variant="body1" textAlign="center">{data.getGrantByUid.description}</Typography>
            <LoadedZone loading={hitProcessing} error={hitError}>
                { hitData &&
                (hitData.grantHit.integer === 1 ?
                    <Stack alignItems="center" gap="0.5rem">
                        <PriceTag testID="GrantAmount" value={data.getGrantByUid.amount} big label={uiContext.i18n.translator('youWon')} />
                        <Feedback testID="GrantHitSuccess" severity="success" message={uiContext.i18n.translator('grantSucceeded', { amount: data.getGrantByUid.amount })} />
                    </Stack>
                : <Feedback testID="GrantHitFailure" severity="error" message={uiContext.i18n.translator(getI18nForGrantHitError(hitData.grantHit.integer, uiContext.i18n.translator, appContext.account!.email))} /> )}
            </LoadedZone>
        </Stack> 
        :
        <Feedback severity="error" message={uiContext.i18n.translator('grantNotFound')} />
        }
    </LoadedZone>
}

export default GrantHit