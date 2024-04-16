cd /home/symbro_test

# create build directory if needed
rm -rf build
mkdir -p build

# unpack the components
unzip ./build.zip -d ./

# copy the components to locations where Docker containers can use it
cd build
rsync -av --progress webapi ./../docker/containers/webapi
rsync -av --progress website ./../docker/containers/website

cd /home/symbro_test/docker/environments/test
docker compose down
docker compose build --no-cache
docker compose up -d

