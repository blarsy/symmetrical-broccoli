import { config } from 'dotenv';
config({ path: '.env' });
export default {
    stateSrv: process.env.STATE_SVR,
    stateSrvPort: new Number(process.env.STATE_PORT).valueOf(),
    logPath: process.env.LOG_PATH,
    dbName: process.env.POSTGRES_DB,
    dbUser: process.env.POSTGRES_USER,
    dbPassword: process.env.POSTGRES_PASSWORD,
    dbHost: process.env.POSTGRES_SERVER,
    dbPort: process.env.POSTGRES_PORT,
    googleServiceAccount: process.env.GOOGLE_SERVICE_ACCOUNT,
    googlePrivateKey: JSON.parse(process.env.GOOGLE_PRIVATE_KEY).privateKey,
    remoteBackupFolderName: process.env.REMOTE_BACKUPS_FOLDER_NAME,
    notificationEmailSender: process.env.NOTIFICATION_MAIL_SENDER,
    notificationDestinator: process.env.NOTIFICATION_DESTINATOR,
    mailApiKey: process.env.SENDGRID_API_KEY,
};
