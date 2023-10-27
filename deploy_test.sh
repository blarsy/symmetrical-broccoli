cd backoffice

yarn build:test || exit 1

cd ..

# make sure you upload your SSH key to the target server first:
# ssh-copy-id -i ~/.ssh/id_rsa.pub YOUR_USER_NAME@IP_ADDRESS_OF_THE_SERVER
# ssh-copy-id -i ~/.ssh/id_rsa.pub root@45.91.168.78

ssh root@45.91.168.78 "mkdir -p /home/symbro_test/docker;"
# copy docker nocodb files
scp -rp ./docker/test/* root@45.91.168.78:/home/symbro_test/docker
scp -rp ./docker/test/.env root@45.91.168.78:/home/symbro_test/docker

# copy settings file
scp -rp ./backoffice/.env.test root@45.91.168.78:/home/symbro_test/.env
# Zip web build files
rm ./web_test.zip
cp -r ./backoffice/src/server/mailing/templates ./backoffice/.next/mailtemplates
cp -rf ./backoffice/.env.test ./backoffice/.next/standalone/.env.production
cd backoffice/.next
zip -q -r --symlinks ../../web_test.zip ./static ./standalone ./mailtemplates ../next.config.js
cd ..
cd ..

# copy other files
scp -rp backoffice/public/ ./web_test.zip *.js *.json yarn.lock root@45.91.168.78:/home/symbro_test

ssh root@45.91.168.78 "sh " < ./remote_test.sh