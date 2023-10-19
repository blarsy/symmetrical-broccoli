# Tope Là (codename Symmetrical-broccoli)
Tope là creates opportunities for associations to receive gifts from organizations & individuals, and barter any kind of resources between one another.
## Installation
Git clone the repo on a local folder (/home/code/symmetrical-broccoli in this document)
### Run the docker containers locally
`cd /home/code/symmetrical-broccoli/docker/local/`

`docker compose up`

### Configure the backend / website
Copy the /home/code/symmetrical-broccoli/backoffice/.env.development.sample file into a file named .env.development in the same folder. Its content should be already ok, except for one value (see next section)
### Initialize Nocodb
- Navigate to the [local Nocodb signup page](http://localhost:8080/dashboard/#/signup)
- Sign up as super admin using a password of your choice (write it down for later use)
- Then, navigate to [the NocoDb app tokens creation page](http://localhost:8080/dashboard/#/account/tokens), and create a token, the name is not important
- Copy the value of the token from the tokens page to the NOCO_API_KEY key in /home/code/symmetrical-broccoli/backoffice/.env.development file
- Navigate to [the database creation/update route](http://localhost:3000/api/system). Once the page loaded, it shoud display {"outcome":"Database initialized."}

You now have a "Tope là"-ready Nocodb backend
### Launch the backend / website
The backoffice sub-repo contains a NextJs project, that both hosts a web api, and a website

`cd /home/code/symmetrical-broccoli/backoffice`

`yarn install`

`yarn dev`

A web api is now hosted locally on http://localhost:3000/api, and a website on http://localhost:3000

### Setup the React-Native dev environment
Copy the /home/code/symmetrical-broccoli/app/.env.sample file into a file named .env in the same folder. Its content should be correct right away.

Install Expo:

`cd /home/code/symmetrical-broccoli/app`

`yarn add expo-cli`

`npx expo start`

Now you can use Expo to launch the web, Android, or IOS version of the Mobile App (just follow the on-screen instructions)