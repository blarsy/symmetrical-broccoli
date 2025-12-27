cd /home/deploy/symbro

# create build directory if needed
rm -rf build
mkdir -p build

# unpack the components
unzip ./build.zip -d ./

# copy the components to locations where Docker containers can use it
cd build
rm -rf ./../docker/containers/webapi/webapi
cp -r webapi ./../docker/containers/webapi/webapi
rm -rf ./../docker/containers/website/website
cp -r website ./../docker/containers/website/website

cd /home/deploy/symbro/docker/environments/prod
docker compose down
docker compose build --no-cache
docker compose up -d