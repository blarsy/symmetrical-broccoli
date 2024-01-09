cd /home/symbro_test

# create build directory if needed
rm -rf build
mkdir -p build

# unpack the components
unzip ./build.zip -d ./

# copy the components to locations where Docker containers can use it
cd build
rsync -av --progress webapi ./../docker/containers/webapi
rsync -av --progress scheduler ./../docker/containers/scheduler
rsync -av --progress website ./../docker/containers/website

cd /home/symbro_test/docker/environments/test
docker compose down
docker compose build --no-cache
docker compose up -d

#Restart the dockerized proxy, as it seems to lose its ways when a container responding to a proxied url is recreated
docker stop docker-sb_proxy-1
docker start docker-sb_proxy-1
