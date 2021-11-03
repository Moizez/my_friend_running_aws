import express from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import moment from 'moment'
import Busboy from 'busboy'

import aws from '../services/aws.js'
import pagarme from '../services/pagarme.js'

import User from '../models/user.js'
import Challenge from '../models/challenge.js'
import Tracking from '../models/tracking.js'
import UserChallenge from '../models/relationship/userChallenge.js'

const router = express.Router()

router.post('/', async (req, res) => {

    let busboy = new Busboy({ headers: req.headers })
    busboy.on('finish', async () => {
        try {

            const userId = mongoose.Types.ObjectId()
            let photo = ''

            if (req.files) {
                const file = req.files.photo

                const nameParts = file.name.split('.')
                const fileName = `${userId}.${nameParts.length - 1}`
                photo = `users/${fileName}`

                const response = await aws.uploadToS3(file, photo)

                if (response.error) {
                    res.json({ error: true, message: error.message })
                    return
                }
            }

            //Criar usuário
            const password = await bcrypt.hash(req.body.password, 10)

            const user = await new User({
                ...req.body,
                _id: userId,
                password,
                photo,
            }).save()

            res.json({ user })

        } catch (error) {
            res.json({ error: true, message: error.message })
        }
    })
    req.pipe(busboy)
})

router.post('/signin', async (req, res) => {
    try {

        const { email, password } = req.body

        const user = await User.findOne({
            email,
            status: 'A'
        })

        if (!user) {
            //res.json({ error: true, message: 'Usuário não encontrado!' })
            throw new Error('Usuário não encontrado!')
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            throw { message: 'E-mail ou senha inválidos!' }
        }

        delete user.password

        res.json({
            user
        })

    } catch (error) {
        res.json({ error: true, message: error.message })
    }
})

router.put('/:userId/accept', async (req, res) => {
    try {

        const { userId } = req.params
        const user = await User.findById(userId)

        const pagarmeUser = await pagarme('/customers', {
            external_id: userId,
            name: user.name,
            type: 'individual',
            country: 'br',
            email: user.email,
            documents: [
                {
                    type: 'cpf',
                    number: user.cpf,
                },
            ],
            phone_numbers: [`+55${user.phone}`],
            birthday: user.birthday,
        })

        if (pagarmeUser.error) {
            throw pagarmeUser
        }

        await User.findByIdAndUpdate(userId, {
            customerId: pagarmeUser.data.id,
            status: 'A'
        })

        res.json({ error: true, message: 'Usuário aceito na plataforma!' })

    } catch (error) {
        res.json({ error: true, message: error.message })
    }
})

router.get('/:userId/challenge', async (req, res) => {

    try {

        const { userId } = req.params

        //RECUPERAR DESAFIO ATUAL
        const challenge = await Challenge.findOne({
            status: 'A'
        })

        if (!challenge) {
            throw new Error('Nenhum desafio ativo!')
        }

        const userChallenge = await UserChallenge.findOne({
            userId,
            challengeId: challenge._id
        })

        // VERIFICAÇÕES DE PERIODO, DIAS E HORAS
        const dayStart = moment(challenge.date.start, 'YYYY-MM-DD')
        const dayEnd = moment(challenge.date.end, 'YYYY-MM-DD')
        const challengePeriod = dayEnd.diff(dayStart, 'days')
        const currentPeriod = moment().diff(dayStart.subtract(1, 'day'), 'days')

        // TAXA DIARIA
        const dailyAmount = challenge.fee / challengePeriod

        // QTD DE PARTICIPAÇÔES
        const participatedTimes = await Tracking.find({
            operation: 'G',
            userId,
            challengeId: challenge._id
        })

        // SALDO CONQUISTADO
        const balance = participatedTimes?.length * dailyAmount

        // CALCULAR SE JA FEZ O DESAFIO DO DIA
        const challengeToday = await Tracking.findOne({
            userId,
            challengeId: challenge._id,
            operation: {
                $in: ['G', 'L']
            },
            register: {
                $lte: moment().endOf('day'),
                $gte: moment().startOf('day')
            }
        })

        // CALCULAR DISCIPLINA
        const periodDiscipline = !!challengeToday ? currentPeriod : currentPeriod - 1
        const discipline = participatedTimes?.length / periodDiscipline || 0

        // RESULTADOS DO DIA
        const dailyResults = await Tracking.find({
            challengeId: challenge._id,
            operation: {
                $in: ['G', 'L']
            },
            register: {
                $lte: moment().endOf('day'),
                $gte: moment().startOf('day')
            }
        }).populate('userId', 'name photo').select('userId amount operation')

        res.json({
            isParticipant: !!userChallenge,
            challenge,
            challengePeriod,
            currentPeriod,
            dailyAmount,
            participatedTimes: participatedTimes?.length,
            balance,
            challengeToday: !!challengeToday,
            discipline,
            dailyResults
        })

    } catch (error) {
        res.json({ error: true, message: error.message })
    }
})

router.get('/:userId/balance', async (req, res) => {
    try {

        const { userId } = req.params

        const records = await Tracking.find({ userId }).sort([['register', -1]])

        const balance = records
            .filter(t => t.operation === 'G')
            .reduce((total, t) => {
                return total + t.amount
            }, 0)

        res.json({
            records,
            balance
        })



    } catch (error) {
        res.json({ error: true, message: error.message })
    }
})

export default router