import express from 'express'
import cors from 'cors'

import { serve, setup } from 'swagger-ui-express'
import * as swaggerDocument from './swagger.json'

import { PORT } from "./config"
import { bizcuitAuthHandler, bizcuitAuthResponseHandler, bizcuitTransactionsHandler } from './handlers'

import { config } from 'dotenv'
if (process.env.NODE_ENV !== 'production') {
    config();
}

const app = express();
app.use(cors())

app.use('/api-docs', serve, setup(swaggerDocument))
app.get('/bizcuit_auth', bizcuitAuthHandler)
app.get('/bizcuit_auth_response', bizcuitAuthResponseHandler)
app.get('/bizcuit_transactions', bizcuitTransactionsHandler)

app.listen(PORT, () => {
    return console.log(`CORS-enabled server is listening on ${PORT}`);
});
