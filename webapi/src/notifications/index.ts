export interface PushNotification {
    to: string,
    title: string,
    body: string,
    data: object
}

export async function sendPushNotification(expoPushToken: string, message: PushNotification) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })
}