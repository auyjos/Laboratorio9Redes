const { Kafka } = require('kafkajs');
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Configuración del servidor Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir archivos estáticos desde el directorio 'public'
app.use(express.static('public'));

// Iniciar el servidor en el puerto 3000
server.listen(3000, () => {
    console.log('Servidor web iniciado en http://localhost:3000');
});

// Variables para almacenar los datos
let all_temp = [];
let all_hume = [];
let all_wind = [];

// Configuración de Kafka
const kafka = new Kafka({
    clientId: 'weather-sensor',
    brokers: ['lab9.alumchat.lol:9092'],
});

const consumer = kafka.consumer({ groupId: 'weather-sensor-group' });

// Función principal
const run = async () => {
    // Conectar al consumidor
    await consumer.connect();
    console.log('Conectado al consumidor de Kafka');

    // Suscribirse al tópico
    await consumer.subscribe({ topic: '201579', fromBeginning: true });

    // Procesar mensajes entrantes
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const mensaje = message.value.toString();
            console.log(`Mensaje recibido: ${mensaje}`);

            // Procesar el mensaje
            const payload = JSON.parse(mensaje);
            all_temp.push(payload.temperatura);
            all_hume.push(payload.humedad);
            all_wind.push(payload.direccion_viento);

            // Emitir los datos al cliente a través de Socket.IO
            io.emit('nuevos-datos', {
                temperatura: payload.temperatura,
                humedad: payload.humedad,
                direccion_viento: payload.direccion_viento,
            });
        },
    });
};

run().catch(console.error);
