import { sendNotificationsSummaryMail } from "../mailing"
import { runAndLog } from "../db_jobs/utils"
import initTranslations from '../i18n'
import { TFunction } from "i18next"
import dayjs from "dayjs"
import logger from "../logger"
import { Pool } from "pg"

const succinctDate = (date: Date, t: TFunction) => {
    const todayMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDay(), 0, 0, 0, 0)
    if (date < todayMidnight) return dayjs(date).format(t('full_date_format'))

    return dayjs(date).tz('Europe/Brussels').format(t('date_format'))
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
            [messageCode: string]: {
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

interface ChatMessageSummaryData {
    [email: string]: EmailSummaryData
}

const getAccountChatMessages = async (emailSummaryData: EmailSummaryData): Promise<string> => {
    const t = await initTranslations(emailSummaryData.lang)
    let chatMessagesList = `                                <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <td style="padding:25px 45px 25px 45px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div style="text-align: center;"><strong><span style="color:#3E3E3E;"><span style="font-size:16px;">${t('chatMessages_mail_section_title')}</span></span></strong></div>
            </td>
        </tr>
    </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <th style="font-size:16px; text-align: center;">${t('sender_column_title')}</th>
            <th style="font-size:16px; text-align: center;">${t('resource_title_column_title')}</th>
            <th style="font-size:16px; text-align: center;">${t('sent_date_column_title')}</th>
            <th style="font-size:16px; text-align: center;">${t('message_text_column_title')}</th>
        </tr>`
    let currentCells = ''
    for (const senderId in emailSummaryData.senders) {
        const msgsForSender = Object.entries(emailSummaryData.senders[senderId].resources).reduce<number>((prev, current) => prev + Object.entries(current[1].messages).length, 0)
        currentCells = currentCells.concat(`<td style="padding:8px 8px 8px 8px;line-height:22px;text-align:inherit;"
    height="100%"
    valign="top"
    bgcolor="" rowspan="${msgsForSender}">
    <div style="text-align: center;"><strong><span style="color:#3E3E3E;"><span style="font-size:16px;">${emailSummaryData.senders[senderId].senderName}</span></span></strong></div>
</td>`)
        for (const resId in emailSummaryData.senders[senderId].resources) {
            currentCells = currentCells.concat(`<td style="padding:8px 8px 8px 8px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="" rowspan="${Object.entries(emailSummaryData.senders[senderId].resources[resId].messages).length}">
                <div style="text-align: center;"><span style="color:#3E3E3E;"><span style="font-size:16px;">${emailSummaryData.senders[senderId].resources[resId].resourceTitle}</span></span></div>
            </td>`)

            for (const msgId in emailSummaryData.senders[senderId].resources[resId].messages) {
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
    return chatMessagesList.concat(`</table>`)
}

const getChatMessageSummaryData = async (pool: Pool): Promise<ChatMessageSummaryData> => {
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
        AND um.created > NOW() - interval '1 day' * bp.days_between_summaries
        AND ad.email IS NOT NULL`, pool, 'Running delayed notifier')

    const emails = {} as ChatMessageSummaryData

    messages.rows.forEach(row => {
        const currentEmail = row.destinatoremail

        if (!emails[currentEmail]) {
            const sortedMessages = messages.rows.filter(msg => msg.destinatoremail === currentEmail).sort((a, b) => {
                // sort by sender (col 3), then sender id (col 8), then resource (col 5), then send date (col 4)
                if (a.sendername < b.sendername) return -1
                else if (a.sendername > b.sendername) return 1
                else {
                    if (a.senderid < b.senderid) return -1
                    else if (a.senderid > b.senderid) return 1
                    else {
                        if (a.resourceid < b.resourceid) return -1
                        else if (a.resourceid > b.resourceid) return 1
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
                if (!emailData.senders[senderCode]) emailData.senders[senderCode] = {
                    senderName: sortedMsg.sendername,
                    resources: {}
                }

                const resourceCode = sortedMsg.resourceid.toString()
                if (!emailData.senders[senderCode].resources[resourceCode]) emailData.senders[senderCode].resources[resourceCode] = {
                    resourceTitle: sortedMsg.resourcetitle,
                    messages: {}
                }

                emailData.senders[senderCode].resources[resourceCode].messages[sortedMsg.messageid.toString()] = {
                    messageText: sortedMsg.messagetext,
                    sent: dayjs.utc(sortedMsg.created).toDate()
                }
            })

            emails[currentEmail] = emailData
        }
    })

    return emails
}

interface AccountNewResourcesData {
    language: string
    id: number
    authors: {
        [authorId: string]: {
            name: string
            newResources: {
                [resourceId: string]: {
                    title: string
                    created: Date
                }
            }
        }
    }
}

interface NewResourcesSummaryData {
    [email: string]: AccountNewResourcesData
}

const getAccountNewResources = async (accountNewResourcesData: AccountNewResourcesData): Promise<string> => {
    const t = await initTranslations(accountNewResourcesData.language)
    let newResourcesList = `                                <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <td style="padding:25px 45px 25px 45px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div style="text-align: center;"><strong><span style="color:#3E3E3E;"><span style="font-size:16px;">${t('newResources_mail_section_title')}</span></span></strong></div>
            </td>
        </tr>
    </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
        <tr>
            <th style="font-size:16px; text-align: center;">${t('creator_column_title')}</th>
            <th style="font-size:16px; text-align: center;">${t('resource_title_column_title')}</th>
            <th style="font-size:16px; text-align: center;">${t('created_date_column_title')}</th>
        </tr>`
    let currentCells = ''
    for (const authorId in accountNewResourcesData.authors) {
        currentCells = currentCells.concat(`<td style="padding:8px 8px 8px 8px;line-height:22px;text-align:inherit;"
    height="100%"
    valign="top"
    bgcolor="" rowspan="${Object.entries(accountNewResourcesData.authors[authorId].newResources).length}">
    <div style="text-align: center;"><strong><span style="color:#3E3E3E;"><span style="font-size:16px;">${accountNewResourcesData.authors[authorId].name}</span></span></strong></div>
</td>`)
        for (const resId in accountNewResourcesData.authors[authorId].newResources) {
            currentCells = currentCells.concat(`<td style="padding:8px 8px 8px 8px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div style="text-align: center;"><span style="color:#3E3E3E;"><span style="font-size:16px;">${accountNewResourcesData.authors[authorId].newResources[resId].title}</span></span></div>
            </td>`)
            currentCells = currentCells.concat(`<td style="padding:8px 8px 8px 8px;line-height:22px;text-align:inherit;"
                height="100%"
                valign="top"
                bgcolor="">
                <div style="text-align: center;"><span style="color:#3E3E3E;"><span style="font-size:16px;">${succinctDate(accountNewResourcesData.authors[authorId].newResources[resId].created, t)}</span></span></div>
            </td>`)

            newResourcesList = newResourcesList.concat(`<tr>`, currentCells, `</tr>`)
            currentCells = ''
        }
    }
    return newResourcesList.concat(`</table>`)
}

const getNewResourcesSummaryData = async (pool: Pool): Promise<NewResourcesSummaryData> => {
    const resources = await runAndLog(`SELECT r.id as resourceid, 
        r.title, 
        author.id as authorid, 
        r.created, 
        author.name as authorname, 
        notified.id as notifiedid, 
        notified.language,
        notified.email as notifiedemail
	FROM sb.notifications n
	INNER JOIN sb.resources r ON n.data::json->'resource_id' IS NOT NULL AND r.id = (n.data::json->>'resource_id')::integer
    INNER JOIN sb.accounts author ON author.id = r.account_id
    INNER JOIN sb.broadcast_prefs bp ON bp.event_type = 2 AND bp.account_id = n.account_id
    INNER JOIN sb.accounts notified ON notified.id = bp.account_id
    WHERE (bp.last_summary_sent IS NULL OR bp.last_summary_sent + interval '1 day' * bp.days_between_summaries < NOW()) AND
        n.read IS NULL AND n.created > NOW() - interval '1 day' * bp.days_between_summaries AND
        r.expiration > NOW() AND
        r.deleted IS NULL AND
        author.id <> notified.id AND
        notified.email IS NOT NULL AND
		n.read IS NULL
    ORDER BY notified.id, author.name, author.id, r.title, r.id, r.created DESC`, pool, `Querying new resources to notify`)

    const resourcesSummaryData = {} as NewResourcesSummaryData

    resources.rows.forEach(row => {
        if(!resourcesSummaryData[row.notifiedemail]) {
            resourcesSummaryData[row.notifiedemail] = { language: row.language, id: row.notifiedid, authors: {} }
        }

        if(!resourcesSummaryData[row.notifiedemail].authors[row.authorid]) {
            resourcesSummaryData[row.notifiedemail].authors[row.authorid] = { name: row.authorname, newResources: {} }
        }

        resourcesSummaryData[row.notifiedemail].authors[row.authorid].newResources[row.resourceid] = { title: row.title, created: dayjs.utc(row.created).toDate() }
    })

    return resourcesSummaryData
}

export const sendSummaries = async (pool: Pool, version: string): Promise<void> => {
    const [resourcesSummaryData, chatMessagesSummaryData] = await Promise.all([
        getNewResourcesSummaryData(pool),
        getChatMessageSummaryData(pool),
        
    ])

    logger.info(`Data objects for sending summaries by email:\nresourcesSummaryData: ${JSON.stringify(resourcesSummaryData)}\nchatMessagesSummaryData: ${JSON.stringify(chatMessagesSummaryData)}`)

    const emails = [] as string[]
    [...Object.keys(resourcesSummaryData), ...Object.keys(chatMessagesSummaryData)].forEach(mail => {
        if(!emails.includes(mail)) emails.push(mail)
    })

    emails.forEach(async email => {
        let resourceSummaryContentPromise, resourceSummaryContent, chatMessagesSummaryContent = '', i18nMailSubject, language = ''
        if(resourcesSummaryData[email]) {
            resourceSummaryContentPromise = getAccountNewResources(resourcesSummaryData[email])
            language = resourcesSummaryData[email].language
        }
        if(chatMessagesSummaryData[email]) {
            chatMessagesSummaryContent = await getAccountChatMessages(chatMessagesSummaryData[email])
            language = chatMessagesSummaryData[email].lang
        }

        resourceSummaryContent = await resourceSummaryContentPromise
        
        const makePostQuery = (eventType: number, accountId: number) => {
            return `UPDATE sb.broadcast_prefs
                SET last_summary_sent = NOW()
                WHERE event_type = ${eventType} AND account_id = ${accountId}`
        }
        const postQuerieInfos: { eventType: number, accountId: number }[] = []

        if(resourceSummaryContent && chatMessagesSummaryContent) {
            i18nMailSubject = 'multiple_new_things_summary_subject'
            postQuerieInfos.push({ eventType: 1, accountId: chatMessagesSummaryData[email].accountId })
            postQuerieInfos.push({ eventType: 2, accountId: resourcesSummaryData[email].id })
        } else if (resourceSummaryContent) {
            i18nMailSubject = 'new_resources_summary_subject'
            postQuerieInfos.push({ eventType: 2, accountId: resourcesSummaryData[email].id })
        } else {
            i18nMailSubject = 'chat_messages_summary_subject'
            postQuerieInfos.push({ eventType: 1, accountId: chatMessagesSummaryData[email].accountId })
        }

        postQuerieInfos.forEach(qry => {
            runAndLog(makePostQuery(qry.eventType, qry.accountId), pool, `Setting last summary time.`)
        })

        sendNotificationsSummaryMail(email, i18nMailSubject, [resourceSummaryContent, chatMessagesSummaryContent].join(''), language, version, pool)
    })
}