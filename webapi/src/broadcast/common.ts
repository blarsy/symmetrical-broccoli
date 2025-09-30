import dayjs from "dayjs"
import { TFunction } from "i18next"

interface NotificationInfo {
    title: string
    summary: string
}
export const makeNotificationInfo = (data: any, t: TFunction<"translation", undefined>): NotificationInfo => {
    switch(data.info) {
        case 'COMPLETE_PROFILE':
            return {
                title: t('pleaseCompleteProfile'),
                summary: t('benefitsOrFillingProfile')
            }
        case 'SOME_RESOURCES_SUSPENDED':
            return {
                title: t('someResourcesSuspended'),
                summary: t('resourcesSuspendedSummary')
            }
        case 'WARNING_LOW_TOKEN_AMOUNT':
            return {
                title: t('warningLowAmountOfToken'),
                summary: t('summaryLowAmountOfToken')
            }
        case 'TOKENS_RECEIVED':
            return {
                title: t('tokenReceived'),
                summary: t('tokensReceivedSummary', { amount: data.amountReceived, from: data.fromAccount })
            }
        case 'TOKENS_SENT':
            return {
                title: t('tokenSent'),
                summary: t('tokensSentSummary', { amount: data.amountSent, to: data.toAccount })
            }
        case 'WELCOME_TOKEN_USER':
            return {
                title: t('welcomeTokenUser'),
                summary: t('tokenUserBenefits')
            }
        case 'BID_RECEIVED':
            return {
                title: t('bidReceived'),
                summary: t('bidReceivedSummary', { from: data.receivedFrom, resourceTitle: data.resourceTitle })
            }
        case 'BID_REFUSED':
            return {
                title: t('bidRefused'),
                summary: t('bidRefusedSummary', { from: data.refusedBy, resourceTitle: data.resourceTitle })
            }
        case 'BID_ACCEPTED':
            return {
                title: t('bidAccepted'),
                summary: t('bidAcceptedSummary', { from: data.acceptedBy, resourceTitle: data.resourceTitle })
            }
        case 'BID_AUTO_DELETED_AFTER_RESOURCE_EXPIRED':
            return {
                title: t('bidAutoDeleted'),
                summary: t('bidAutoDeletedSummary', { from: data.resourceAuthor, resourceTitle: data.resourceTitle })
            }
        case 'BID_CANCELLED':
            return {
                title: t('bidCancelled'),
                summary: t('bidCancelledSummary', { from: data.cancelledBy, resourceTitle: data.resourceTitle })
            }
        case 'BID_EXPIRED':
            return {
                title: t('bidExpired'),
                summary: t('bidExpiredSummary', { from: data.resourceAuthor, resourceTitle: data.resourceTitle })
            }
        case 'TOKEN_GRANTED':
            return {
                title: t('tokenGranted'),
                summary: t('tokenGrantedSummary', { grantorName: data.grantorName, amountOfTokens: data.amountOfTokens })
            }
        case 'AIRDROP_RECEIVED':
            return {
                title: t('airdropReceived'),
                summary: t('airdropReceivedSummary', { campaignName: data.campaignName, amountOfTokens: data.amountOfTokens })
            }
        case 'CAMPAIGN_BEGUN':
            return {
                title: t('campaignBegun', { campaignName: data.campaignName }),
                summary: t('campaignBegunSummary', { multiplier: data.multiplier, airdropAmount: data.airdropAmount })
            }
        case 'AIRDROP_SOON':
            return {
                title: t('airdropSoon', { airdropAmount: data.airdropAmount }),
                summary: t('airdropSoonSummary', { airdrop: dayjs(data.airdrop).format(t('full_date_format')), campaignName: data.campaignName })
            }
        default:
            throw new Error(`Unexpected notification type '${data.info}'`)
    }
}