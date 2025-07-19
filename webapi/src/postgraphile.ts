import { postgraphile, PostGraphileOptions, makePluginHook } from "postgraphile"
import { Config, createPool } from './config'
import SubscriptionPlugin from './SubscriptionPlugin'
import PgPubsub from "@graphile/pg-pubsub"
import logger from './logger'

const pluginHook = makePluginHook([PgPubsub])

export default (config: Config) => {
    const pool = createPool(config, 'postgraphile')
    
    const pgConfig: PostGraphileOptions = config.production ? {
        retryOnInitFail: true,
        graphiql: false,
        disableQueryLog: true
      }: {
        retryOnInitFail: true,
        watchPg: true,
        exportGqlSchemaPath: `schema_${config.version}.graphql`,
        graphiql: true,
        enhanceGraphiql: true,
        enableCors: true
    }

    const infoLine = `Configuring a Postgraphile instance for db ${config.db} on ${config.host}, port ${config.apiPort}`
    logger.info(infoLine)
     
    return postgraphile(
        pool,
        "sb",
        { ...pgConfig, ...{
            // Settings common to all environments
            pluginHook,
            subscriptions: true,
            appendPlugins: [SubscriptionPlugin(config.version)],
            legacyRelations: "omit",
            graphqlRoute: `/graphql`,
            graphiqlRoute: `/graphiql`,
            eventStreamRoute: `/graphql/stream`,
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
                    logger.error(`Req ${req.url}, Res status ${res.statusCode}: ${res.statusMessage}\n${JSON.stringify(err)}`, new Error('Details were logged'))
                    return err
                } catch(e) {
                    console.log(`error when trying to log error ${e}`)
                    return err
                }
            }
        }}
    )
}