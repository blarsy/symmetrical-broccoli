import { gql, useMutation } from "@apollo/client"
import { LoadingButton } from "@mui/lab"
import { Card, CardContent, Typography, CardActions, Button, Stack, IconButton } from "@mui/material"
import Link from "next/link"
import { useContext } from "react"
import { PriceTag } from "../misc"
import ResourceHeader from "../resources/ResourceHeader"
import Feedback from "../scaffold/Feedback"
import { UiContext } from "../scaffold/UiContextProvider"
import { Bid } from "@/lib/schema"
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import DeleteIcon from '@mui/icons-material/Delete'
import dayjs from "dayjs"
import { urlFromPublicId } from "@/lib/images"
import Chat from '@/app/img/CHAT.svg'
import { primaryColor } from "@/utils"

export const DELETE_BID = gql`mutation DeleteBid($bidId: Int) {
  deleteBid(input: {bidId: $bidId}) {
    integer
  }
}`

const BidSent = ({ bid, onCancel } : {bid: Bid, onCancel: () => void}) => {
    const uiContext = useContext(UiContext)
    const [deleteBid, {loading, error, reset}] = useMutation(DELETE_BID)
    const dateFormat = uiContext.i18n.translator('dateTimeFormat')

    let inactiveMessage
    if(bid.accepted) {
        inactiveMessage = uiContext.i18n.translator('inactiveBecauseAccepted', { date: dayjs(bid.accepted).format(dateFormat)})
    } else if(bid.refused) {
        inactiveMessage = uiContext.i18n.translator('inactiveBecauseRefused', { date: dayjs(bid.refused).format(dateFormat)})
    } else if(bid.validUntil < new Date()) {
        inactiveMessage = uiContext.i18n.translator('inactiveBecauseExpired', { date: dayjs(bid.validUntil).format(dateFormat) })
    } else if(bid.deleted) {
        inactiveMessage = uiContext.i18n.translator('inactiveBecauseDeleted', { date: dayjs(bid.deleted).format(dateFormat) })
    }

    return <Card>
        <CardContent sx={{ paddingBottom: 0 }}>
            <Stack direction="row" justifyContent="space-between">
                <ResourceHeader sx={{ padding: 0 }} data={{
                    id: bid.resource.id, resource: bid.resource, participantId: 0, otherAccount: {
                        id: bid.resource.account!.id, name: bid.resource.account!.name,
                        participantId: 0, avatarImageUrl: bid.resource.account!.avatarImagePublicId && urlFromPublicId(bid.resource.account!.avatarImagePublicId)
                    }
                }}/>
                <Link href={`/webapp/${uiContext.version}/chat/new/${bid.resource.id}?with=${bid.account.id}`}>
                    <IconButton color="primary">
                        <Chat fill={ primaryColor } width="2.5rem" height="2.5rem"/>
                    </IconButton>
                </Link>
            </Stack>
            <Stack data-testid={`BidSent:${bid.id}`} direction="row" gap="0.5rem" alignItems="center">
                <PriceTag value={bid.amountOfTokens} label={uiContext.i18n.translator('yourBidAmountOfTokenLabel')}/>
                {bid.resource.price && <Stack direction="row" gap="0.5rem" alignItems="center">
                    <Typography color="primary" variant="body1">{uiContext.i18n.translator(uiContext.i18n.translator('resourcePriceLabel'))} </Typography>
                    <Typography color="primary" variant="h6">{bid.resource.price} </Typography>
                </Stack>}
            </Stack>
            { !inactiveMessage && bid.validUntil && <Typography variant="body1" color="primary">{uiContext.i18n.translator('expiresIn')} {dayjs(bid.validUntil).fromNow()}</Typography> }
            { inactiveMessage && <Typography variant="body1" color="primary">{inactiveMessage}</Typography> }
        </CardContent>
        <CardActions sx={{ justifyContent: 'space-around' }}>
            <Button LinkComponent={Link} href={`/webapp/${uiContext.version}/view/${bid.resource.id}`} endIcon={<OpenInNewIcon />}>{uiContext.i18n.translator('viewResourceButton')}</Button>
            { !inactiveMessage && <LoadingButton data-testid={`BidSent:${bid.id}:DeleteButton`} loading={loading} endIcon={<DeleteIcon />} onClick={async () => {
                await deleteBid({ variables: { bidId: bid.id } })
                onCancel()
            }}>{uiContext.i18n.translator('deleteBidButton')}</LoadingButton> }
        </CardActions>
        <Feedback severity="error" detail={error?.message} message={uiContext.i18n.translator('requestError')} onClose={reset} visible={!!error} />
    </Card>
}

export default BidSent