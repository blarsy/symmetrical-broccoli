import dotenv from 'dotenv'

const rawConfig = dotenv.config({ path: `./.env`, debug: true })

export default {
    db: process.env.POSTGRES_DB || rawConfig.parsed?.POSTGRES_DB,
    dbPassword: process.env.POSTGRES_PASSWORD || rawConfig.parsed?.POSTGRES_PASSWORD,
    host: process.env.POSTGRES_HOST || rawConfig.parsed?.POSTGRES_HOST,
    jwtSecret: process.env.JWT_SECRET || rawConfig.parsed?.JWT_SECRET,
    jwtType: process.env.JWT_TYPE || rawConfig.parsed?.JWT_TYPE,
    mailPath: process.env.MAIL_PATH || rawConfig.parsed?.MAIL_PATH,
    mailTemplatesLocation: process.env.MAIL_TEMPLATES_LOCATION || rawConfig.parsed?.MAIL_TEMPLATES_LOCATION,
    port: process.env.POSTGRES_PORT || rawConfig.parsed?.POSTGRES_PORT,
    user: process.env.POSTGRES_USER || rawConfig.parsed?.POSTGRES_USER,
    mailApiKey: process.env.SENDGRID_API_KEY || rawConfig.parsed?.SENDGRID_API_KEY,
    production: process.env.NODE_ENV || rawConfig.parsed?.NODE_ENV === 'production',
    noreplyEmail: process.env.NOREPLY_EMAIL || rawConfig.parsed?.NOREPLY_EMAIL,
    websiteUrl: process.env.PUBLIC_WEBSITE_URL || rawConfig.parsed?.PUBLIC_WEBSITE_URL,
    webAppUrl: process.env.TOPELA_WEBAPP_URL || rawConfig.parsed?.TOPELA_WEBAPP_URL,
    webClientUrls: process.env.NEXT_PUBLIC_APP_URLS || rawConfig.parsed?.NEXT_PUBLIC_APP_URLS,
    productName: 'Tope-là'
}