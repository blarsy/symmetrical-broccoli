import { ensureDataStoreCreated } from './server/noco'

export const register = () => {
    const load = async () => {
        ensureDataStoreCreated()
    }
    load().then(console.log('startup done'), e => console.log(`Startup failed`, e))
}