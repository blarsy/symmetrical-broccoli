# make sure you upload your SSH key to the target server first:
# ssh-copy-id -i ~/.ssh/id_rsa.pub YOUR_USER_NAME@IP_ADDRESS_OF_THE_SERVER
# ssh-copy-id -i ~/.ssh/id_rsa.pub root@45.91.168.78

ssh root@45.91.168.78 "mkdir -p /home/symbro/docker;"
# copy docker nocodb files
scp -rp ./docker/prod/* root@45.91.168.78:/home/symbro/docker
scp -rp ./docker/prod/.env root@45.91.168.78:/home/symbro/docker

# copy settings file
scp -rp ./backoffice/.env.production root@45.91.168.78:/home/symbro
# Zip web build files
rm ./web.zip
cd backoffice/.next
zip -r -q --symlinks ../../web.zip ./static ./standalone ../next.config.js
cd ..
cd ..

# copy other files
scp -rp backoffice/public/ ./web.zip *.js *.json yarn.lock root@45.91.168.78:/home/symbro

ssh root@45.91.168.78 "sh " < ./remote.sh