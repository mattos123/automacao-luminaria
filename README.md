## Controle de Luminária via Raspberry Pi + Alexa

Automação de liga/desliga utilizando Raspberry Pi, um relé, Ngrok e uma Skill Alexa que dispara um pulso elétrico na luminária.

Este projeto demonstra como automatizar uma luminária controlada por pulso elétrico, utilizando:

- **Raspberry Pi** para acionar o relé (pulso elétrico)
- **Ngrok** para expor um endpoint HTTP público
- **Skill Alexa** (código deste repositório em `index.js`) para enviar requisições GET ao endpoint

---

## 📌 Arquitetura Geral

- **Raspberry Pi** gera o pulso de acionamento através de um **relé** conectado ao GPIO.
- Um **servidor HTTP** (por exemplo, Flask em Python) roda no Raspberry Pi e expõe uma rota GET, como `/acionar-rele`, que dispara o pulso.
- O **Ngrok** cria uma URL pública para esse servidor HTTP.
- A **Skill Alexa** recebe comandos de voz (`LigarIntent`, `DesligarIntent`) e envia requisições GET para a URL pública gerada pelo Ngrok.

> Observação: este repositório contém o código da **Skill Alexa** (`index.js`) e um **script de teste do relé** (`rele.py`). O servidor HTTP/Flask pode ser implementado à parte no Raspberry Pi, usando os exemplos abaixo.

---

## 📁 Estrutura do Repositório

```text
/
├── rele.py         # Script de teste para acionar o relé no Raspberry Pi
├── index.js        # Handler da Skill Alexa (para AWS Lambda)
├── package.json    # Dependências da Skill Alexa
└── README.md       # Este arquivo
```

---

## 🐍 Código Python – Controle do Relé (teste local)

Arquivo: `rele.py`

Este script envia um pulso rápido para o relé conectado ao pino GPIO 17. Ele é útil para testar o acionamento físico da luminária diretamente no Raspberry Pi.

```python
import RPi.GPIO as GPIO
import time

PIN_RELE = 17

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN_RELE, GPIO.OUT)

try:
    # Pulso rápido
    GPIO.output(PIN_RELE, GPIO.LOW)   # Liga
    time.sleep(0.05)                  # ~50 ms
    GPIO.output(PIN_RELE, GPIO.HIGH)  # Desliga
    print("Pulso enviado")

finally:
    GPIO.cleanup()
```

---

## 🐍 Exemplo de API Flask no Raspberry Pi

Um exemplo de como você pode expor o acionamento do relé via HTTP usando Flask. Esse arquivo pode ser salvo como `api.py` no Raspberry Pi (não está necessariamente versionado neste repositório).

```python
from flask import Flask, jsonify
import RPi.GPIO as GPIO
import time

PIN_RELE = 17

GPIO.setmode(GPIO.BCM)
GPIO.setup(PIN_RELE, GPIO.OUT)

app = Flask(__name__)


def acionar_rele():
    GPIO.output(PIN_RELE, GPIO.LOW)
    time.sleep(0.05)
    GPIO.output(PIN_RELE, GPIO.HIGH)


@app.route("/acionar-rele", methods=["GET"])
def acionar():
    try:
        acionar_rele()
        return jsonify({"status": "ok", "mensagem": "Pulso enviado"})
    except Exception as e:
        return jsonify({"status": "erro", "mensagem": str(e)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
```

---

## 🌐 Exposição com Ngrok

No Raspberry Pi, com o servidor Flask (ou outro servidor HTTP) rodando na porta 5000, execute:

```bash
ngrok http 5000
```

O Ngrok fornecerá uma URL pública, algo como:

```text
https://SEU-ENDPOINT.ngrok-free.app/acionar-rele
```

Essa URL será usada pela Skill Alexa para acionar a luminária.

---

## 🤖 Código da Skill Alexa

A Skill Alexa (handler Lambda) envia requisições GET para o endpoint HTTP exposto no Raspberry Pi via Ngrok. O código abaixo é baseado em `index.js` deste projeto.

Arquivo: `index.js`

```javascript
const Alexa = require('ask-sdk-core');
const https = require('https');

const ENDPOINT = 'https://SEU-ENDPOINT.ngrok-free.app/acionar-rele';

function callAPI() {
    return new Promise((resolve, reject) => {
        console.log('Chamando API...');
        https.get(ENDPOINT, (resp) => {
            let data = '';
            resp.on('data', chunk => data += chunk);
            resp.on('end', () => {
                console.log('Resposta da API:', data);
                resolve(data);
            });
        }).on('error', err => {
            console.error('Erro na chamada API:', err);
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
```

### 🔧 Intent Names

No modelo de interação da Skill, configure pelo menos estes intents:

- **`LigarIntent`** – para ligar a luminária.
- **`DesligarIntent`** – para desligar a luminária.

Certifique-se de que os nomes dos intents no console da Alexa batam exatamente com os usados no código.

---

## 📦 package.json

Arquivo: `package.json`

```json
{
  "name": "controle-luminaria",
  "version": "1.0.0",
  "description": "Skill Alexa para controlar luminária via endpoint GET",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "ask-sdk-core": "^2.10.0",
    "ask-sdk-model": "^1.0.0"
  },
  "engines": {
    "node": ">=10"
  }
}
```

---

## 🗣️ Exemplos de Comandos de Voz

Depois de criar e ativar a Skill na sua conta Amazon, você pode usar frases como:

- **"Alexa, pedir ao controle da luminária para ligar"**
- **"Alexa, pedir ao controle da luminária para desligar"**

A frase exata vai depender do **nome de invocação** que você configurar na Skill (por exemplo, "controle da luminária").

---

## ✅ Conclusão

Este projeto mostra como combinar um Raspberry Pi, eletrônica simples (relé) e uma Skill Alexa para criar uma solução prática de automação residencial totalmente personalizada, baseada em pulso elétrico na luminária.

Se quiser, posso gerar também diagramas, imagens, fluxogramas ou um vídeo explicativo para complementar o repositório.