import { config } from 'dotenv'
config({ path: '.env' })

export default {
    stateSrv: process.env.STATE_SVR as string,
    stateSrvPort: new Number(process.env.STATE_PORT as string).valueOf(),
    logPath: process.env.LOG_PATH as string,
    dbName: process.env.POSTGRES_DB as string,
    dbUser: process.env.POSTGRES_USER as string,
    dbPassword: process.env.POSTGRES_PASSWORD as string,
    dbHost: process.env.POSTGRES_SERVER as string,
    dbPort: process.env.POSTGRES_PORT as string,
    googleServiceAccount: process.env.GOOGLE_SERVICE_ACCOUNT as string,
    googlePrivateKey: JSON.parse(process.env.GOOGLE_PRIVATE_KEY as string).privateKey,
    remoteBackupFolderName: process.env.REMOTE_BACKUPS_FOLDER_NAME as string,
    notificationEmailSender: process.env.NOTIFICATION_MAIL_SENDER as string,
    notificationDestinator: process.env.NOTIFICATION_DESTINATOR as string,
    mailApiKey: process.env.SENDGRID_API_KEY as string,
    
}