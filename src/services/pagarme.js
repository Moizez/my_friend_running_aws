import axios from 'axios';

const api = axios.create({
    baseURL: 'https://api.pagar.me/1',
});

const api_key = process.env.REACT_APP_PAGARME

console.log(api_key)

export default async (endpoint, data, method = 'post') => {
    try {
        const response = await api[method](endpoint, {
            api_key,
            ...data,
        });

        return { error: false, data: response.data };
    } catch (err) {
        return {
            error: true,
            message: JSON.stringify(err.response.data.errors[0]),
        };
    }
};