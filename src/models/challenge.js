import mongoose from "mongoose";
const Schema = mongoose.Schema

const Challenge = new Schema({

    title: {
        type: String,
        require: [true, 'Título é obrigatório!']
    },

    description: {
        type: String,
        require: [true, 'Descrição é obrigatória!']
    },

    fee: {
        type: Number,
        require: [true, 'Taxa é obrigatório!']
    },

    distance: {
        type: Number,
        require: [true, 'Disntância é obrigatório!']
    },

    date: {
        start: {
            type: String,
            require: [true, 'Data de início é obrigatória!']
        },
        end: {
            type: String,
            require: [true, 'Data de encerramento é obrigatória!']
        },
    },

    time: {
        start: {
            type: String,
            require: [true, 'Hora do início é obrigatória!']
        },
        end: {
            type: String,
            require: [true, 'Hora do encerramento é obrigatória!']
        },
    },

    ytVideoId: {
        type: String,
        require: [true, 'ID do do vídeo do YouTube é obrigatório!']
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

export default mongoose.model('Challenge', Challenge)