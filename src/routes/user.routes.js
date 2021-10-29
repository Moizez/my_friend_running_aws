import express from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import moment from 'moment'
import Busboy from 'busboy'

import aws from '../services/aws.js'

import User from '../models/user.js'
import Challenge from '../models/challenge.js'
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

router.put('/:userId/challenge', async (req, res) => {
    try {

        const { userId } = req.params
        const user = await User.findById(userId)

        // const challenge = await Challenge.findOne({
        //     status: 'A'
        // })

        // if (!)

    } catch (error) {
        res.json({ error: true, message: error.message })
    }
})

export default router