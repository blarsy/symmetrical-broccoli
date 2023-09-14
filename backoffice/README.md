This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## How to generate a free SSL certificate from Let's encrypt - through its Certbot utility, and apply it to a docker-hosted NGinx container

**Assuming:**
* the IP address of the remote server with Docker installed is 45.91.169.85
* the url we are securing with https is admin.homeostasis.pro

First ensure your web server does not systematically redirect everything to SSL, as Certbot will need the Letsencrypt servers to query for challenge files on HTTP. So, comment out the https redirection line in /docker/prod/nginx.conf, so that it looks like:

`server {`

`    listen 80;`

`    location /.well-known/ {`

`        root /var/local;`

`    }`

`    #return 301 https://$host$request_uri;`

`}`

make sure you uploaded your SSH key to the target server first (should be done only once in the server's lifetime)

`ssh-copy-id -i ~/.ssh/id_rsa.pub root@45.91.169.85`

connect to the server

`ssh root@45.91.169.85`

Generate the certificates

`certbot certonly --webroot --domains admin.homeostasis.pro`

You'll have to provide the path where to create the challenge files required for Letsencrypt to verify you actually control the public IP address you request the certificates for. Thus, when prompted:

`Input the webroot for admin.homeostasis.pro: (Enter 'c' to cancel):`

Type

`/etc/letsencrypt`

Make sure the certificate files are accessible to the web proxy docker container:

`cd /etc/letsencrypt`

`chmod -R 705 archive`

`chmod -R 705 live`

Should be good to go ...

## How to RENEW a free SSL certificate from Let's encrypt - through its Certbot utility, and apply it to a docker-hosted NGinx container

First ensure your web server does not systematically redirect everything to SSL, as Certbot will need the Letsencrypt servers to query for challenge files on HTTP. So, comment out the https redirection line in /docker/prod/nginx.conf, so that it looks like:

`server {`

`    listen 80;`

`    location /.well-known/ {`

`        root /var/local;`

`    }`

`    #return 301 https://$host$request_uri;`

`}`

Run the deployment script

`sh deploy.sh`

connect to the server

`ssh root@45.91.169.85`

`certbot renew`

when renewal is successful, restore the nginx.config file:

`server {`

`    listen 80;`

`    location /.well-known/ {`

`        root /var/local;`

`    }`

`    return 301 https://$host$request_uri;`

`}`

Run the deployment script again

`sh deploy.sh`