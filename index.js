
const Alexa = require('ask-sdk-core');
const https = require('https');

function callAPI() {
    return new Promise((resolve, reject) => {
        console.log("Chamando API...");
        https.get('https://ENDPOINT.ngrok-free.app/acionar-rele', (resp) => {
            let data = '';
            resp.on('data', chunk => data += chunk);
            resp.on('end', () => {
                console.log("Resposta da API:", data);
                resolve(data);
            });
        }).on('error', err => {
            console.error("Erro na chamada API:", err);
            reject(err);
        });
    });
}

const LigarIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'LigarIntent';
    },
    async handle(handlerInput) {
        try {
            await callAPI();
            return handlerInput.responseBuilder
                .speak('Luminária ligada com sucesso!')
                .getResponse();
        } catch (error) {
            return handlerInput.responseBuilder
                .speak('Houve um erro ao ligar a luminária.')
                .getResponse();
        }
    }
};

const DesligarIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'DesligarIntent';
    },
    async handle(handlerInput) {
        try {
            await callAPI();
            return handlerInput.responseBuilder
                .speak('Luminária desligada com sucesso!')
                .getResponse();
        } catch (error) {
            return handlerInput.responseBuilder
                .speak('Houve um erro ao desligar a luminária.')
                .getResponse();
        }
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(LigarIntentHandler, DesligarIntentHandler)
    .lambda();
