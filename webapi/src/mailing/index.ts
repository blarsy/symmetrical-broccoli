import sgMail from '@sendgrid/mail'
import { readFile } from 'fs/promises'
import Handlebars from 'handlebars'
import { recordMail } from './recordMail'
import getConfig,{ getCommonConfig, getConnectionString } from '../config'
import initTranslations from '../i18n'
import { runAndLog } from '../db_jobs/utils'


export const sendMail = async (from: string, to: string, subject: string, plainText: string, htmlContent: string, version: string, connectionString: string) => {
    const config = await getConfig(version)

    const msg = {
      to,
      from,
      subject,
      text: plainText,
      html: htmlContent
    }

    const promises: Promise<any>[] = (config.production && !config.doNotSendMails) ?
        [sgMail.send(msg)] :
        [recordMail(msg)]

    promises.push(persistMail(msg, connectionString))

    await Promise.all(promises)
}

export const sendNoReplyMail = async (to: string, subject: string, plainText: string, htmlContent: string, version: string) => {
    const config = await getConfig(version)
    const connectionString = getConnectionString(config)
    
    await sendMail(config.noreplyEmail!, to, subject, plainText, htmlContent, version, connectionString)
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

export const sendEmailActivationCode = async (email: string, code: string, lang: string, version: string) => {
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
        htmlContent, version)
}

export const sendAccountRecoveryMail = async (email: string, code: string, lang: string, version: string) => {
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
        htmlContent, version)
}

export const sendNotificationsSummaryMail = async (email: string, headingI18nCode: string, content: string, lang: string, version: string) => {
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

    await sendNoReplyMail(email, heading, t('no_plaintext_content'), htmlContent, version )
}

const persistMail = async (msg: { to: string; from: string; subject: string; text: string; html: string }, connectionString: string): Promise<void> => {
    runAndLog(`INSERT INTO sb.mails(
        account_id, email, sent_from, subject, text_content, html_content)
        VALUES ((SELECT id FROM sb.accounts WHERE email = '${msg.to}' ), '${msg.to}', '${msg.from}', 
        $1, $2, $3);`, connectionString, 'Persisting mail', [
            msg.subject, msg.text, msg.html
        ])
}
