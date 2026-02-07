import { Bid } from "@/lib/schema"
import { gql, useMutation } from "@apollo/client"
import { LoadingButton } from "@mui/lab"
import { Card, CardContent, Typography, CardActions, Button, Stack, IconButton } from "@mui/material"
import Link from "next/link"
import { useContext, useState } from "react"
import ResourceHeader from "../resources/ResourceHeader"
import Feedback from "../scaffold/Feedback"
import { UiContext } from "../scaffold/UiContextProvider"
import AcceptIcon from '@mui/icons-material/ThumbUp'
import RefuseIcon from '@mui/icons-material/ThumbDown'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import dayjs from "dayjs"
import { ConfirmDialog, PriceTag } from "../misc"
import { urlFromPublicId } from "@/lib/images"
import Chat from '@/app/img/CHAT.svg?react'
import { primaryColor } from "@/utils"

export const ACCEPT_BID = gql`mutation AcceptBid($bidId: UUID) {
  acceptBid(input: {bidId: $bidId}) {
    integer
  }
}`

export const REFUSE_BID = gql`mutation RefuseBid($bidId: UUID, $notificationType: String) {
  refuseBid(input: {bidId: $bidId, notificationType: $notificationType}) {
    integer
  }
}`

interface Props {
  bid: Bid
  onAction: (accepted: boolean) => void
}

const BidReceived = ({ bid, onAction } : Props) => {
    const uiContext = useContext(UiContext)
    const [acceptBid, {loading: accepting, error: acceptError, reset: acceptReset}] = useMutation(ACCEPT_BID)
    const [refuseBid, {loading: refusing, error: refuseError, reset: refuseReset}] = useMutation(REFUSE_BID)
    const [confirmingAcceptation, setConfirmingAcceptation] = useState(false)
    const testId = `BidReceived:${bid.id}`
    const dateFormat = uiContext.i18n.translator('dateTimeFormat')

    let inactiveMessage
    if(bid.accepted) {
        inactiveMessage = uiContext.i18n.translator('inactiveBecauseAccepted', { date: dayjs(bid.accepted).format(dateFormat)})
    } else if(bid.refused) {
        inactiveMessage = uiContext.i18n.translator('inactiveBecauseRefused', { date: dayjs(bid.refused).format(dateFormat) })
    } else if(bid.validUntil < new Date()) {
        inactiveMessage = uiContext.i18n.translator('inactiveBecauseExpired', { date: dayjs(bid.validUntil).format(dateFormat) })
    } else if(bid.deleted) {
        inactiveMessage = uiContext.i18n.translator('inactiveBecauseDeleted', { date: dayjs(bid.deleted).format(dateFormat) })
    }
    return <Card>
        <CardContent sx={{ paddingBottom: 0 }}>
            <Stack direction="row" justifyContent="space-between">
              <ResourceHeader data={{
                  id: bid.resource.id, resource: bid.resource, participantId: 0, otherAccount: {
                      id: bid.account.id, name: bid.account.name,
                      participantId: 0, avatarImageUrl: bid.account.avatarImagePublicId && urlFromPublicId(bid.account.avatarImagePublicId)
                  }
              }}/>
              <Link href={`/webapp/${uiContext.version}/chat/new/${bid.resource.id}?with=${bid.account.id}`}>
                <IconButton color="primary">
                  <Chat fill={ primaryColor } width="2.5rem" height="2.5rem"/>
                </IconButton>
              </Link>
            </Stack>
            <Stack data-testid={testId} direction="row" gap="0.5rem" alignItems="center">
                <PriceTag value={bid.amountOfTokens} label={uiContext.i18n.translator('yourReceivedBidAmountOfTokenLabel')} />
                {bid.resource.price && <Stack direction="row" gap="0.5rem" alignItems="center">
                    <Typography color="primary" variant="body1">{uiContext.i18n.translator(uiContext.i18n.translator('resourcePriceLabel'))} </Typography>
                    <Typography color="primary" variant="h6">{bid.resource.price} </Typography>
                </Stack>}
            </Stack>
            { !inactiveMessage && bid.validUntil &&  <Typography variant="body1" color="primary">{uiContext.i18n.translator('expiresIn')} {dayjs(bid.validUntil).fromNow()}</Typography> }
            { inactiveMessage &&  <Typography variant="body1" color="primary">{inactiveMessage}</Typography> }
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-around' }}>
            <Button LinkComponent={Link} href={`/webapp/${uiContext.version}/view/${bid.resource.id}`} endIcon={<OpenInNewIcon />}>{uiContext.i18n.translator('viewResourceButton')}</Button>
            { !inactiveMessage && <LoadingButton data-testid={`${testId}:AcceptButton`} loading={accepting} endIcon={<AcceptIcon />} onClick={() => {
              setConfirmingAcceptation(true)
            }}>{uiContext.i18n.translator('acceptBidButton')}</LoadingButton>}
            { !inactiveMessage && <LoadingButton data-testid={`${testId}:RefuseButton`} loading={refusing} endIcon={<RefuseIcon />} onClick={async () => {
              await refuseBid({ variables: { bidId: bid.id, notificationType: null } })
              onAction(false)
            }}>{uiContext.i18n.translator('RefuseBidButton')}</LoadingButton>}
        </CardActions>
        <Feedback severity="error" detail={(acceptError && acceptError.message) || (refuseError && refuseError.message)} message={uiContext.i18n.translator('requestError')} onClose={() => {
          acceptReset()
          refuseReset()
        }} visible={!!(acceptError || refuseError)} />
        <ConfirmDialog testID={testId} onClose={async response => {
          if(response) {
            await acceptBid({ variables: { bidId: bid.id } })
            onAction(true)
          }
          setConfirmingAcceptation(false)
        }} title={uiContext.i18n.translator('acceptOfferConfirmDialogTitle')} visible={confirmingAcceptation}
        text={uiContext.i18n.translator('meaningOfAcceptingOffer')} okButtonCaption={uiContext.i18n.translator('confirmAcceptButton')}
        cancelButtonCaption={uiContext.i18n.translator('denyAcceptButton')}/>
    </Card>
}

export default BidReceived