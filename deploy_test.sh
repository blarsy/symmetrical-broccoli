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
cp .env.production .env.production.bak
cp .env.test .env.production
yarn build || exit 1
cp .env.production.bak .env.production
rm .env.production.bak
cd ..

# clean build folder
rm -rf ./build
mkdir -p ./build

# copy the built scheduler to a location easy to zip
rsync -av --progress scheduler ./build --exclude node_modules --exclude .yarn

if [[ ! -f ./build/scheduler/.env.test ]] ; then
    echo 'File "env.test" for scheduler is not there, aborting.'
    exit
fi

cp ./build/scheduler/.env.test ./build/scheduler/.env

# copy the built web api to a location easy to zip
rsync -av --progress webapi ./build --exclude node_modules --exclude .yarn

if [[ ! -f ./build/webapi/.env.test ]] ; then
    echo 'File "env.test" for webapi is not there, aborting.'
    exit
fi

cp ./build/webapi/.env.test ./build/webapi/.env

# copy the built website to a location easy to zip
rsync -av --progress backoffice/.next/static ./build/website
rsync -av --progress backoffice/.next/standalone ./build/website
rsync -av --progress backoffice/next.config.js ./build/website
rsync -av --progress backoffice/public ./build/website

rm -f ./build.zip
zip -q -r --symlinks ./build.zip ./build

if [[ ! -f ./docker/environments/test/.env ]] ; then
    echo 'File ".env" for docker environment is not there, aborting.'
    exit
fi

# create docker folder
ssh root@103.13.210.152 "mkdir -p /home/symbro_test/docker/containers;mkdir -p /home/symbro_test/docker/environments/test;"
# copy docker files
scp -rp ./docker/containers/* root@103.13.210.152:/home/symbro_test/docker/containers
scp -rp ./docker/environments/test/.env root@103.13.210.152:/home/symbro_test/docker/environments/test
scp -rp ./docker/environments/test/* root@103.13.210.152:/home/symbro_test/docker/environments/test

scp -rp ./build.zip root@103.13.210.152:/home/symbro_test


# execute remote deployment script
ssh root@103.13.210.152 "sh " < ./remote_test.sh