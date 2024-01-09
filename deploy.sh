# build the scheduler
cd scheduler
yarn build
cd ..

# build the web api
cd webapi
yarn build
cd ..

# build the website
cd backoffice
yarn build || exit 1
cd ..

# clean build folder
rm -rf ./build
mkdir -p ./build

# copy the built scheduler to a location easy to zip
rsync -av --progress scheduler ./build --exclude node_modules --exclude .yarn
cp ./build/scheduler/.env.production ./build/scheduler/.env

# copy the built web api to a location easy to zip
rsync -av --progress webapi ./build --exclude node_modules --exclude .yarn
cp ./build/webapi/.env.production ./build/webapi/.env

# copy the built website to a location easy to zip
rsync -av --progress backoffice/.next/static ./build/website
rsync -av --progress backoffice/.next/standalone ./build/website
rsync -av --progress backoffice/next.config.js ./build/website
rsync -av --progress backoffice/public ./build/website

rm -f ./build.zip
zip -q -r --symlinks ./build.zip ./build

# create docker folder
ssh root@45.91.168.78 "mkdir -p /home/symbro/docker/containers;mkdir -p /home/symbro/docker/environments/prod;"
# copy docker files
scp -rp ./docker/containers/* root@45.91.168.78:/home/symbro/docker/containers
scp -rp ./docker/environments/prod/.env root@45.91.168.78:/home/symbro/docker/environments/prod
scp -rp ./docker/environments/prod/* root@45.91.168.78:/home/symbro/docker/environments/prod

scp -rp ./build.zip root@45.91.168.78:/home/symbro


# execute remote deployment script
ssh root@45.91.168.78 "sh " < ./remote.sh