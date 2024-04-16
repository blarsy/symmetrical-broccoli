import { Queue, Worker } from 'bullmq';
import { logData } from './logger.js';
import jobs from './jobs.js';
import settings from './settings.js';
import sgMail from '@sendgrid/mail';
const notifyFailure = async (jobName, error) => {
    const msg = {
        to: settings.notificationDestinator,
        from: settings.notificationEmailSender,
        subject: 'Symbro scheduled job failed',
        text: `Job ${jobName} failed with error ${JSON.stringify(error)}`
    };
    sgMail.setApiKey(settings.mailApiKey);
    await sgMail.send(msg);
};
export default async () => {
    const queueName = 'sbQueue';
    const redisConnection = {
        host: settings.stateSrv,
        port: settings.stateSrvPort
    };
    logData('Launching scheduler with Redis settings ', redisConnection);
    const queue = new Queue(queueName, { connection: redisConnection });
    const worker = new Worker(queueName, async (job) => {
        if (jobs[job.name]) {
            await jobs[job.name](job.data);
        }
        else {
            throw new Error(`Cannot find job ${job.name}`);
        }
    }, { connection: redisConnection });
    worker.on('completed', job => logData('Job Finished', `Job ${job.name}`));
    worker.on('failed', async (job, err) => {
        logData(`Job ${job?.name} failed`, err, true);
        if (job?.data.sendMailOnFailure) {
            try {
                await notifyFailure(job.name, err);
            }
            catch (e) {
                logData(`Failure sending notification mail`, e, true);
            }
        }
    });
    worker.on('active', (job => logData('Job starting', `Job ${job.name}`)));
    async function addJobs() {
        try {
            logData('Startup', 'Starting jobs ...', false);
            await queue.obliterate({ force: true });
            await queue.add('dailyBackup', { sendMailOnFailure: true }, { repeat: { immediately: true, pattern: '0 0 0 * * *' } });
            logData('Startup', 'Jobs started', false);
        }
        catch (e) {
            logData('Job startup error', e, true);
        }
    }
    await addJobs();
};
