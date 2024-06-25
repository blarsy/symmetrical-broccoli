import { sendMessagesSummaryMail } from "../mailing"
import { runAndLog } from "./utils"

// const succinctDate = (date: Date) => {
//     let format = t('full_date_format')
// }

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
}

interface ChatMessageSummaryRawData {
    [email: string]: EmailSummaryData
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
        WHERE um.created > NOW() - interval '1 day' * bp.days_between_summaries`, connectionString, 'Running delayed notifier')

    const emails = {} as ChatMessageSummaryRawData

    messages.rows.forEach(row => {
        const currentEmail = row.destinatoremail

        if(!emails[currentEmail]){
            console.log(`sorting ${messages.rows.filter(msg => msg.destinatoremail === currentEmail)}`)
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
            console.log('sortedMessages', sortedMessages)

            const emailData = {} as EmailSummaryData

            emailData.lang = row.destinatorlanguage
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
    console.log(JSON.stringify(emails))

    // for(const email in emails) {
    //     try {
    //         const chatMessagesList = sortedMessages.map((msg, idx) => `      <tr>
    //     <td style="padding:45px 45px 45px 45px;line-height:22px;text-align:inherit;"
    //         height="100%"
    //         valign="top"
    //         bgcolor="">
    //         <div style="text-align: center;"><strong><span style="color:#3E3E3E;"><span style="font-size:24px;">${idx === 0 ? msg[3] : ''}</span></span></strong></div>
    //     </td>
    //     <td style="padding:45px 45px 45px 45px;line-height:22px;text-align:inherit;"
    //         height="100%"
    //         valign="top"
    //         bgcolor="">
    //         <div style="text-align: center;"><span style="color:#3E3E3E;"><span style="font-size:20px;">${msg[0]}</span></span></div>
    //     </td>
    //     <td style="padding:45px 45px 45px 45px;line-height:22px;text-align:inherit;"
    //         height="100%"
    //         valign="top"
    //         bgcolor="">
    //         <div style="text-align: center;"><span style="color:#3E3E3E;"><span style="font-size:20px;">${succinctDate(msg[3])}</span></span></div>
    //     </td>
    //   </tr>`).join()

    //         emails[destinator] = { text: `    <table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;">
    //             ${chatMessagesList}
    // </table>`, lang: msg[7] } 
    //     } catch (e) {

    //     }
    // }
}