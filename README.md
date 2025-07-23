# Tope Là (codename Symmetrical-broccoli)
Tope là creates opportunities for associations to receive gifts from organizations & individuals, and exchange any kind of resources between one another.
## Installation
Git clone the repo on a local folder (/home/code/symmetrical-broccoli in this document)
### Run the database docker container locally
`cd /home/code/symmetrical-broccoli/docker/environments/local/`

`docker compose up`

### Configure the backend / website
Copy the /home/code/symmetrical-broccoli/backoffice/.env.development.sample file into a file named .env.development in the same folder. Its content should be already ok, except for system-specific values (passwords, secrets, ...)
### Configure the GraphQl webapi
Copy the /home/code/symmetrical-broccoli/webapi/.env.development.sample file into a file named .env in the same folder. Its content should be already ok, except for system-specific values (passwords, secrets, ...)
### Launch the webapi
The webapi sub-repo contains a Postgraphile project, self hosted using ExpressJs

`cd /home/code/symmetrical-broccoli/webapi`

`yarn`

`yarn dev`

A web api is now hosted locally on http://localhost:3000/graphql
### Launch the backend / website
The backoffice sub-repo contains a NextJs project, that both hosts a (tiny) web api, and a website

`cd /home/code/symmetrical-broccoli/backoffice`

`yarn`

`yarn dev`

A web api is now hosted locally on http://localhost:3001/api, and a website on http://localhost:3001

### Setup the React-Native dev environment
Copy the /home/code/symmetrical-broccoli/app/.env.sample file into a file named .env.development in the same folder. Its content should be correct right away.

Install Expo:

`cd /home/code/symmetrical-broccoli/app`

`yarn add expo-cli`

`yarn`

`npx expo start`

Now you can use Expo to launch the web, Android, or IOS version of the Mobile App (just follow the on-screen instructions)