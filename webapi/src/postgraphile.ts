import { Pool } from 'pg'
import { postgraphile, PostGraphileOptions, makePluginHook } from "postgraphile"
import config from './config'
import SubscriptionPlugin from './SubscriptionPlugin'
import PgPubsub from "@graphile/pg-pubsub"
import logger from './logger'

const pluginHook = makePluginHook([PgPubsub])

const env = process.env.NODE_ENV || 'development'
const pool = new Pool({
    user: config.user,
    host: config.host,
    database: config.db,
    password: config.dbPassword,
    port: Number(config.port),
})

const pgConfig: PostGraphileOptions = env.toLowerCase() === 'production' ? {
    retryOnInitFail: true,
    //extendedErrors: ["errcode"],
    graphiql: false,
    disableQueryLog: true
  }: {
    watchPg: true,
    //showErrorStack: "json",
    //extendedErrors: ["hint", "detail", "errcode"],
    exportGqlSchemaPath: "schema.graphql",
    graphiql: true,
    enhanceGraphiql: true,
    enableCors: true
}

export {pool as pg}

export default postgraphile(
    pool,
    "sb",
    { ...pgConfig, ...{
        // Settings common to all environments
        pluginHook,
        subscriptions: true,
        appendPlugins: [SubscriptionPlugin],
        legacyRelations: "omit",
        graphqlRoute: "/graphql",
        graphiqlRoute: "/graphiql",
        eventStreamRoute: "/graphql/stream",
        enableQueryBatching: true,
        ignoreRBAC: false,
        dynamicJson: true,
        setofFunctionsContainNulls: false,
        jwtSecret: config.jwtSecret,
        jwtPgTypeIdentifier: config.jwtType,
        pgDefaultRole: 'anonymous',
        disableDefaultMutations: true,
        handleErrors: (err, req, res) => {
            try {
                console.log(`Error caught in ${req.url}`)
                logger.error(`Req ${req.url}, Res status ${res.statusCode}: ${res.statusMessage}\n${JSON.stringify(err)}`, new Error('Details were logged'))
                return err
            } catch(e) {
                console.log(`error when trying to log error ${e}`)
                return err
            }
        }
    }}
)