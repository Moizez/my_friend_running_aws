import express from "express"
import morgan from "morgan"
import cors from 'cors'
import busboy from "connect-busboy"
import busboyBodyParser from 'busboy-body-parser'

import './database.js'

import userRoutes from './src/routes/user.routes.js'

const app = express()

app.use(morgan('dev'))
app.use(express.json())
app.use(busboy())
app.use(busboyBodyParser())
app.use(cors())

app.use('/user', userRoutes)

app.listen(8000, () => {
    console.log('MONEY RUNNER WS RODANDO...')
})