import express from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import moment from 'moment'
import Busboy from 'busboy'
import _ from 'lodash'

import aws from '../services/aws.js'
import pagarme from '../services/pagarme.js'
import util from '../utils/util.js'

import User from '../models/user.js'
import Challenge from '../models/challenge.js'
import Tracking from '../models/tracking.js'
import UserChallenge from '../models/relationship/userChallenge.js'

const router = express.Router()

router.post('/join', async (req, res) => {

    console.log('Caiu aqui 01')

    try {

        console.log('Caiu aqui 02')

        const { userId, challengeId, creditCard } = req.body

        // LER DADOS DO USUÁRIO E DESAFIO
        const user = await User.findById(userId)
        const challenge = await Challenge.findById(challengeId)

        const challengePrice = util.toCents(challenge.fee)

        // CRIAR TRANSAÇÃO DO PAGARME
        const createPaymente = await pagarme('/transactions', {
            amount: challengePrice,
            ...creditCard,
            customer: {
                id: user.customerId
            },
            billing: {
                name: 'Trinity Moss',
                address: {
                    country: 'br',
                    state: 'sp',
                    city: 'Cotia',
                    neighborhood: 'Rio Cotia',
                    street: 'Rua Matrix',
                    street_number: '9999',
                    zipcode: '06714360',
                }
            },
            items: [
                {
                    id: challenge._id,
                    title: challenge.title,
                    unit_price: challengePrice,
                    quantity: 1,
                    tangible: false,
                },
            ]
        })

        if (createPaymente.error) {
            console.log('Caiu aqui 03')
            throw createPaymente
        }

        // COLOCAR O REGISTRO NO TRACKING
        await new Tracking({
            userId,
            challengeId,
            operation: 'F',
            transactionId: createPaymente.data.id,
            amount: challenge.fee
        }).save()

        // ATRELAR O USER AO CHALLENGE
        await new UserChallenge({
            userId,
            challengeId
        }).save()

        res.json({ message: 'Desafio aceito!' })

    } catch (error) {
        console.log('Caiu aqui 04')
        res.json({ error: true, message: error.message })
    }

})

router.post('/tracking', async (req, res) => {

    try {

        const { userId, challengeId, operation } = req.body

        const existentTrackingType = await Tracking.findOne({
            userId,
            challengeId,
            operation,
            register: {
                $lte: moment().endOf('day'),
                $gte: moment().startOf('day')
            }
        })

        if (!existentTrackingType) {
            await new Tracking(req.body).save()
        }

        res.json({ message: 'Evento registrado!' })

    } catch (error) {
        res.json({ error: true, message: error.message })
    }
})


router.get('/:challengeId/ranking', async (req, res) => {
    try {

        const { challengeId } = req.params

        const challenge = await Challenge.findById(challengeId)

        // PERIODO ATUAL E O PERIODO TOTAL
        const dayStart = moment(challenge.date.start, 'YYYY-MM-DD')
        const dayEnd = moment(challenge.date.end, 'YYYY-MM-DD')
        const challengePeriod = dayEnd.diff(dayStart, 'days')
        const currentPeriod = moment().diff(dayStart.subtract(1, 'day'), 'days')

        const trackings = await Tracking.find({
            challengeId,
            operation: ['G', 'L']
        }).populate('userId', 'name photo')

        const trackingByUser = _
            .chain(trackings)
            .groupBy('userId._id')
            .toArray()
            .map(trackUser => ({
                _id: trackUser[0].userId._id,
                name: trackUser[0].userId.name,
                photo: trackUser[0].userId.photo,
                performance: trackUser.filter(t => t.operation === 'G').length
            })).orderBy('performance', 'desc')

        const extraBalance = trackings
            .filter(t => t.operation === 'L')
            .reduce((total, t) => {
                return total + t.amount
            }, 0)

        res.json({
            extraBalance,
            challengePeriod,
            currentPeriod,
            challengeDate: challenge.data,
            trackingByUser
        })

    } catch (error) {
        res.json({ error: true, message: error.message })
    }
})

export default router