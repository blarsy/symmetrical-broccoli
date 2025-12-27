# build the web api
cd webapi
yarn build
cd ..

# build the website
cd backoffice

if [[ -f ./build/webapi/.env.production.bak ]] ; then
    echo 'File ".env.production.bak" for webapi is present, suggesting a previous test env deployment failed, restoring .env.production before going further.'
    cp .env.production.bak .env.production
    rm .env.production.bak
fi

yarn build || exit 1
cd ..

# clean build folder
rm -rf ./build
mkdir -p ./build

# copy the built web api to a location easy to zip
rsync -av --progress webapi ./build --exclude node_modules --exclude .yarn

if [[ ! -f ./build/webapi/.env.production ]] ; then
    echo 'File "env.production" for webapi is not there, aborting.'
    exit
fi

cp ./build/webapi/.env.production ./build/webapi/.env

# copy the built website to a location easy to zip
rsync -av --progress backoffice/.next/static ./build/website
rsync -av --progress backoffice/.next/standalone ./build/website
rsync -av --progress backoffice/next.config.js ./build/website
rsync -av --progress backoffice/public ./build/website

rm -f ./build.zip
zip -q -r --symlinks ./build.zip ./build

if [[ ! -f ./docker/environments/prod/.env ]] ; then
    echo 'File ".env" for docker environment is not there, aborting.'
    exit
fi

# create docker folder
ssh topela-prod "mkdir -p /home/deploy/symbro/docker/containers;mkdir -p /home/deploy/symbro/docker/environments/prod;"
# copy docker files
scp -rp ./docker/containers/* topela-prod:/home/deploy/symbro/docker/containers
scp -rp ./docker/environments/prod/.env topela-prod:/home/deploy/symbro/docker/environments/prod
scp -rp ./docker/environments/prod/* topela-prod:/home/deploy/symbro/docker/environments/prod

scp -rp ./build.zip topela-prod:/home/deploy/symbro


# execute remote deployment script
ssh topela-prod "sh " < ./remote.sh