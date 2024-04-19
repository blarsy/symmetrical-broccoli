import sgMail from '@sendgrid/mail'
import { readFile } from 'fs/promises'
import Handlebars from 'handlebars'
import { recordMail } from './recordMail'
import config from '../config'
import initTranslations from '../i18n'

export const sendMail = async (from: string, to: string, subject: string, plainText: string, htmlContent: string) => {
    const msg = {
      to,
      from,
      subject,
      text: plainText,
      html: htmlContent
    }

    if(config.production){
        sgMail.setApiKey(config.mailApiKey!)
        await sgMail.send(msg)
    } else {
        await recordMail(msg)
    }
}

export const sendNoReplyMail = async (to: string, subject: string, plainText: string, htmlContent: string) => {
    await sendMail(config.noreplyEmail!, to, subject, plainText, htmlContent)
}

let partialsPreparePromise: Promise<void> | null = null
const preparePartials = async () => {
    if(!partialsPreparePromise) {
        partialsPreparePromise = new Promise(async (resolve, reject) => {
            try {
                const partial = (await readFile(`${config.mailTemplatesLocation}headerPartial.html`)).toString()
                Handlebars.registerPartial(
                    "headerPartial", 
                    partial
                )
                resolve()
            } catch(e) {
                reject(e)
            }
        })
    }
    return partialsPreparePromise
}

export const sendEmailActivationCode = async (email: string, code: string, lang: string) => {
    const t = await initTranslations(lang)
    const heading = t('activate_email_subject')
    const link = `${config.webAppUrl}activate/${code}`
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
        htmlContent)
}

export const sendAccountRecoveryMail = async (email: string, code: string, lang: string) => {
    console.log(`sendAccountRecoveryMail ${email}, ${code}`)
    const t = await initTranslations(lang)
    const heading = t('recover_account_subject')
    const link = `${config.webAppUrl}recover/${code}`
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
        htmlContent)
}