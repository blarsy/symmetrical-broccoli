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

# this is not added to the production deployment script, because should the database container not be running when this script runs, it would be wiped out, volumes included
docker system prune -f

docker compose down
docker compose build --no-cache
docker compose up -d

