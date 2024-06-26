import logger from "../logger"
import { sendMessagesSummaryMail } from "../mailing"
import { runAndLog } from "./utils"
import initTranslations from '../i18n'
import { TFunction } from "i18next"
import dayjs from "dayjs"

const succinctDate = (date: Date, t: TFunction) => {
    const todayMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDay(), 0, 0, 0, 0)
    if(date < todayMidnight) return dayjs(date).format(t('full_date_format'))
    
    return dayjs(date).format(t('date_format')) 
}

interface SenderSummaryData {
    [senderId: string]: {
        senderName: string,
        resources: ResourceSummaryData
    }
}

interface ResourceSummaryData {
    [resourceId: string]: {
        resourceTitle: string
        messages: {
            [messageCode: string]:  {
                messageText: string
                sent: Date
            }
        }
    }
}

interface EmailSummaryData {
    lang: string
    senders: SenderSummaryData
    accountId: number
}

interface ChatMessageSummaryRawData {
    [email: string]: EmailSummaryData
}

const notifyAccount = async (email: string, emailSummaryData: EmailSummaryData) => {
    try {
        const t = await initTranslations(emailSummaryData.lang)
        let chatMessagesList = `<table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
            <tr>
                <th style="font-size:16px; text-align: center;">${t('sender_column_title')}</th>
                <th style="font-size:16px; text-align: center;">${t('resource_title_column_title')}</th>
                <th style="font-size:16px; text-align: center;">${t('sent_date_column_title')}</th>
                <th style="font-size:16px; text-align: center;">${t('message_text_column_title')}</th>
            </tr>`
        let currentCells = ''
        for(const senderId in emailSummaryData.senders){
            const msgsForSender = Object.entries(emailSummaryData.senders[senderId].resources).reduce<number>((prev, current) => prev + Object.entries(current[1].messages).length, 0)
            currentCells = currentCells.concat(`<td style="padding:8px 8px 8px 8px;line-height:22px;text-align:inherit;"
        height="100%"
        valign="top"
        bgcolor="" rowspan="${msgsForSender}">
        <div style="text-align: center;"><strong><span style="color:#3E3E3E;"><span style="font-size:16px;">${emailSummaryData.senders[senderId].senderName}</span></span></strong></div>
    </td>`)
            for(const resId in emailSummaryData.senders[senderId].resources) {
                currentCells = currentCells.concat(`<td style="padding:8px 8px 8px 8px;line-height:22px;text-align:inherit;"
                    height="100%"
                    valign="top"
                    bgcolor="" rowspan="${Object.entries(emailSummaryData.senders[senderId].resources[resId].messages).length}">
                    <div style="text-align: center;"><span style="color:#3E3E3E;"><span style="font-size:16px;">${emailSummaryData.senders[senderId].resources[resId].resourceTitle}</span></span></div>
                </td>`)

                for(const msgId in emailSummaryData.senders[senderId].resources[resId].messages) {
                    currentCells = currentCells.concat(`<td style="padding:8px 8px 8px 8px;line-height:22px;text-align:inherit;"
                        height="100%"
                        valign="top"
                        bgcolor="">
                        <div style="text-align: center;"><span style="color:#3E3E3E;"><span style="font-size:12px;">${succinctDate(emailSummaryData.senders[senderId].resources[resId].messages[msgId].sent, t)}</span></span></div>
                    </td>
                    <td style="padding:8px 8px 8px 8px;line-height:22px;text-align:inherit;"
                        height="100%"
                        valign="top"
                        bgcolor="">
                        <div style="text-align: center;"><span style="color:#3E3E3E;"><span style="font-size:16px;">${emailSummaryData.senders[senderId].resources[resId].messages[msgId].messageText}</span></span></div>
                    </td>`)

                    chatMessagesList = chatMessagesList.concat(`<tr>`, currentCells, `</tr>`)
                    currentCells = ''
                }
            }
        }
        chatMessagesList = chatMessagesList.concat(`</table>`)

        return sendMessagesSummaryMail(email, chatMessagesList, emailSummaryData.lang)
    } catch (e) {
        logger.error(`Error when sending chat messages summary mail to ${email}`, e)
    }
}

export const sendSummaries = async (connectionString: string): Promise<void> => {
    const messages = await runAndLog(`SELECT m.text as messagetext,
            ad.id as destinatorid,
            ad.email as destinatoremail,
            aa.name as sendername,
            m.created,
            r.id as resourceid,
            r.title as resourcetitle,
            ad.language as destinatorlanguage,
            aa.id as senderid,
            m.id as messageid
        FROM sb.unread_messages um
        INNER JOIN sb.messages m ON m.id = um.message_id
        INNER JOIN sb.participants destinator ON destinator.id = um.participant_id
        INNER JOIN sb.accounts ad ON ad.id = destinator.account_id
        INNER JOIN sb.conversations c ON c.id = destinator.conversation_id
        INNER JOIN sb.participants author ON author.id = m.participant_id
        INNER JOIN sb.accounts aa ON aa.id = author.account_id
        INNER JOIN sb.resources r ON r.id = c.resource_id
        INNER JOIN sb.broadcast_prefs bp ON bp.account_id = destinator.account_id AND bp.event_type = 1
        WHERE (bp.last_summary_sent IS NULL OR bp.last_summary_sent + interval '1 day' * bp.days_between_summaries < NOW())
        AND um.created > NOW() - interval '1 day' * bp.days_between_summaries`, connectionString, 'Running delayed notifier')

    const emails = {} as ChatMessageSummaryRawData

    messages.rows.forEach(row => {
        const currentEmail = row.destinatoremail

        if(!emails[currentEmail]){
            const sortedMessages = messages.rows.filter(msg => msg.destinatoremail === currentEmail).sort((a, b) => {
                // sort by sender (col 3), then sender id (col 8), then resource (col 5), then send date (col 4)
                if(a.sendername < b.sendername) return -1
                else if (a.sendername > b.sendername) return 1
                else {
                    if(a.senderid < b.senderid) return -1
                    else if(a.senderid > b.senderid) return 1
                    else {
                        if(a.resourceid < b.resourceid) return -1
                        else if(a.resourceid > b.resourceid) return 1
                        else return a.created < b.created ? -1 : (a.created === b.created ? 0 : 1)
                    }
                }
            })

            const emailData = {} as EmailSummaryData

            emailData.lang = row.destinatorlanguage
            emailData.accountId = row.destinatorid
            emailData.senders = {}

            sortedMessages.forEach(sortedMsg => {
                const senderCode = sortedMsg.senderid.toString()
                if(!emailData.senders[senderCode]) emailData.senders[senderCode] = {
                    senderName: sortedMsg.sendername,
                    resources: {}
                }

                const resourceCode = sortedMsg.resourceid.toString()
                if(!emailData.senders[senderCode].resources[resourceCode]) emailData.senders[senderCode].resources[resourceCode] = {
                    resourceTitle: sortedMsg.resourcetitle,
                    messages: {}
                }

                emailData.senders[senderCode].resources[resourceCode].messages[sortedMsg.messageid.toString()] = {
                    messageText: sortedMsg.messagetext,
                    sent: sortedMsg.created
                }
            })

            emails[currentEmail] = emailData
        }
    })

    for(const email in emails) {
        notifyAccount(email, emails[email])
        await runAndLog(`UPDATE sb.broadcast_prefs
            SET last_summary_sent = NOW()
            WHERE event_type = 1 AND account_id = ${emails[email].accountId}`, connectionString, `Setting last summary time.`)
    }

}