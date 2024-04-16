import dotenv from 'dotenv'

const rawConfig = dotenv.config({ path: `./.env`, debug: true })

export default {
    db: process.env.POSTGRES_DB || rawConfig.parsed?.POSTGRES_DB,
    dbPassword: process.env.POSTGRES_PASSWORD || rawConfig.parsed?.POSTGRES_PASSWORD,
    googleServiceAccount: process.env.GOOGLE_SERVICE_ACCOUNT  || rawConfig.parsed?.GOOGLE_SERVICE_ACCOUNT,
    googlePrivateKey: JSON.parse((process.env.GOOGLE_PRIVATE_KEY  || rawConfig.parsed?.GOOGLE_PRIVATE_KEY) as string).privateKey,
    host: process.env.POSTGRES_HOST || rawConfig.parsed?.POSTGRES_HOST,
    jwtSecret: process.env.JWT_SECRET || rawConfig.parsed?.JWT_SECRET,
    jwtType: process.env.JWT_TYPE || rawConfig.parsed?.JWT_TYPE,
    logPath: process.env.LOG_PATH  || rawConfig.parsed?.LOG_PATH,
    mailPath: process.env.MAIL_PATH || rawConfig.parsed?.MAIL_PATH,
    mailTemplatesLocation: process.env.MAIL_TEMPLATES_LOCATION || rawConfig.parsed?.MAIL_TEMPLATES_LOCATION,
    port: process.env.POSTGRES_PORT || rawConfig.parsed?.POSTGRES_PORT,
    user: process.env.POSTGRES_USER || rawConfig.parsed?.POSTGRES_USER,
    mailApiKey: process.env.SENDGRID_API_KEY || rawConfig.parsed?.SENDGRID_API_KEY,
    noreplyEmail: process.env.NOREPLY_EMAIL || rawConfig.parsed?.NOREPLY_EMAIL,
    notificationEmailSender: process.env.NOTIFICATION_MAIL_SENDER  || rawConfig.parsed?.NOTIFICATION_MAIL_SENDER,
    notificationDestinator: process.env.NOTIFICATION_DESTINATOR  || rawConfig.parsed?.NOTIFICATION_DESTINATOR,
    production: process.env.NODE_ENV || rawConfig.parsed?.NODE_ENV === 'production',
    productName: 'Tope-là',
    pushNotificationsUrlPrefix: process.env.PUSH_NOTIFICATIONS_URL_PREFIX || rawConfig.parsed?.PUSH_NOTIFICATIONS_URL_PREFIX,
    remoteBackupFolderName: (process.env.REMOTE_BACKUPS_FOLDER_NAME  || rawConfig.parsed?.REMOTE_BACKUPS_FOLDER_NAME) as string,
    websiteUrl: process.env.PUBLIC_WEBSITE_URL || rawConfig.parsed?.PUBLIC_WEBSITE_URL,
    webAppUrl: process.env.TOPELA_WEBAPP_URL || rawConfig.parsed?.TOPELA_WEBAPP_URL,
    webClientUrls: process.env.NEXT_PUBLIC_APP_URLS || rawConfig.parsed?.NEXT_PUBLIC_APP_URLS,
}