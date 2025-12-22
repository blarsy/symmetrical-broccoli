import { readFile } from 'fs/promises'
import Handlebars from 'handlebars'
import getConfig,{ getCommonConfig } from '../config'
import initTranslations from '../i18n'
import { runAndLog } from '../db_jobs/utils'
import { Pool } from 'pg'
import FormData from "form-data"
import Mailgun from "mailgun.js"

interface MailData {
    to: string,
    from: string,
    subject: string,
    text: string,
    html: string
  }

export const sendMail = async (from: string, to: string, subject: string, plainText: string, htmlContent: string, version: string, pool: Pool) => {
    const config = await getConfig(version)

    const msg: MailData = {
        to,
        from,
        subject,
        text: plainText,
        html: htmlContent
    }

    const sendViaMailgun = async (mail: MailData) => {
        const mailgun = new Mailgun(FormData);
        const mg = mailgun.client({
            username: "api",
            key: config.mailApiKey,
            url: config.mailApiUrl
        })

        await mg.messages.create(config.mailDomain, {
            from: mail.from,
            to: [mail.to],
            subject: mail.subject,
            html: mail.html,
            text: mail.text
        })
    }

    const promises: Promise<void>[] = (config.production && !config.doNotSendMails) ?
        [sendViaMailgun(msg)] :
        []

    promises.push(persistMail(msg, pool, version))

    await Promise.all(promises)
}

export const sendNoReplyMail = async (to: string, subject: string, plainText: string, htmlContent: string, version: string, pool: Pool) => {
    const config = await getConfig(version)
    
    await sendMail(config.noreplyEmail!, to, subject, plainText, htmlContent, version, pool)
}

let partialsPreparePromise: Promise<void> | null = null
const preparePartials = async () => {
    if(!partialsPreparePromise) {
        const config = await getCommonConfig()
        partialsPreparePromise = new Promise(async (resolve, reject) => {
            try {
                const partials = await Promise.all([
                    readFile(`${config.mailTemplatesLocation}headerPartial.html`, { encoding: 'ascii' }),
                    readFile(`${config.mailTemplatesLocation}mailSettingsPartial.html`, { encoding: 'ascii' })
                ])
                Handlebars.registerPartial(
                    "headerPartial", 
                    partials[0]
                )
                Handlebars.registerPartial(
                    "mailSettingsPartial", 
                    partials[1]
                )
                resolve()
            } catch(e) {
                reject(e)
            }
        })
    }
    return partialsPreparePromise
}

export const sendEmailActivationCode = async (email: string, code: string, lang: string, version: string, pool: Pool) => {
    const config = await getCommonConfig()
    const t = await initTranslations(lang)
    const heading = t('activate_email_subject')
    const link = `${config.webAppUrl}${version}/activate/${code}`
    const text = t('activate_email_text', { productName: config.productName})

    await preparePartials()
    const source = await readFile(`${config.mailTemplatesLocation}recoverAccount.html`)
    const template = Handlebars.compile(source.toString())

    const data = { heading, text,
        "button": t('activate_email_button_label'), link, header: {
        logoUrl: `${config.websiteUrl}logo.jpeg`
    }}
    const htmlContent = template(data)

    await sendNoReplyMail(email, heading, 
        `${text}${link}`, 
        htmlContent, version, pool)
}

export const sendAccountRecoveryMail = async (email: string, code: string, lang: string, version: string, pool: Pool) => {
    const config = await getCommonConfig()
    const t = await initTranslations(lang)
    const heading = t('recover_account_subject')
    const link = `${config.webAppUrl}${version}/recover/${code}`
    const text = t('recover_account_text', { productName: config.productName})

    await preparePartials()
    const source = await readFile(`${config.mailTemplatesLocation}recoverAccount.html`)
    const template = Handlebars.compile(source.toString())

    const data = { heading, text,
        "button": t('restore_account_button_label'), link, header: {
        logoUrl: `${config.websiteUrl}logo.jpeg`
    }}
    const htmlContent = template(data)

    await sendNoReplyMail(email, heading, 
        `${text}${link}`, 
        htmlContent, version, pool)
}

export const sendNotificationsSummaryMail = async (email: string, headingI18nCode: string, content: string, lang: string, version: string, pool: Pool, postSendTask: (email: string) => Promise<void>) => {
    const config = await getCommonConfig()
    const t = await initTranslations(lang)

    await preparePartials()
    const source = await readFile(`${config.mailTemplatesLocation}notificationsSummary.html`, { encoding: 'ascii' })

    const template = Handlebars.compile(source)
    const heading = t(headingI18nCode, { productName: config.productName})

    const data = {
        content,
        productName : config.productName,
        heading,
        header: {
            logoUrl: `${config.websiteUrl}logo.jpeg`
        },
        footer: {
            mailSettingsInstructions: t('mail_settings_instructions', { productName: config.productName})
        }
    }

    const htmlContent = template(data)

    await sendNoReplyMail(email, heading, t('no_plaintext_content'), htmlContent, version, pool )

    return postSendTask(email)
}

const persistMail = async (msg: { to: string; from: string; subject: string; text: string; html: string }, pool: Pool, version: string): Promise<void> => {
    runAndLog(`INSERT INTO sb.mails(
        account_id, email, sent_from, subject, text_content, html_content)
        VALUES ((SELECT id FROM sb.accounts WHERE email = '${msg.to}' ), '${msg.to}', '${msg.from}', 
        $1, $2, $3);`, pool, 'Persisting mail', version, [
            msg.subject, msg.text, msg.html
        ])
}
