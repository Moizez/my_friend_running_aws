import mongoose from "mongoose";
const Schema = mongoose.Schema

const Tracking = new Schema({

    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        require: [true, 'Usuário é obrigatório']
    },

    challengeId: {
        type: mongoose.Types.ObjectId,
        ref: 'Challenge',
        require: [true, 'Desafio é obrigatório']
    },

    operation: {
        type: String,
        enum: ['F', 'G', 'L', 'W'], //Fee, Gain, Loss, Withdraw
        require: [true, 'Operação é obrigatório']
    },

    amount: {
        type: Number,
        require: [true, 'Valor é obrigatório']
    },

    transactionId: {
        type: String,
        require: [function () {
            return ['F', 'W'].includes(this.operation)
        }, 'ID da transação é obrigatório']
    },

    register: {
        type: Date,
        default: Date.now
    }
})

export default mongoose.model('Tracking', Tracking)