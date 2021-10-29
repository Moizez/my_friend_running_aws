import mongoose from "mongoose";
const Schema = mongoose.Schema

const User = new Schema({

    name: {
        type: String,
        require: [true, 'Nome é obrigatório!']
    },

    email: {
        type: String,
        require: [true, 'E-mail é obrigatório!']
    },

    password: {
        type: String,
        require: [true, 'Senha é obrigatória!']
    },

    photo: {
        type: String,
        require: [true, 'Foto é obrigatória!']
    },

    cpf: {
        type: String,
        require: [true, 'CPF é obrigatório!']
    },

    birthday: {
        type: String,
        require: [true, 'Data de nascimento é obrigatória!']
    },

    costumerId: {
        type: String,
        //require: [true, 'Foto é obrigatória!']
    },

    status: {
        type: String,
        enum: ['A', 'I', 'P'],
        default: 'P'
    },

    register: {
        type: Date,
        default: Date.now
    }

})

export default mongoose.model('User', User)