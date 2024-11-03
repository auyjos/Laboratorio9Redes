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

function Decode(messageBuffer) {
    // Verificar que el mensaje tenga 3 bytes
    if (messageBuffer.length !== 3) {
        throw new Error('Longitud de mensaje inválida');
    }

    // Obtener los bytes del Buffer
    const byte0 = messageBuffer[0];
    const byte1 = messageBuffer[1];
    const byte2 = messageBuffer[2];

    // Reconstruir el total de 24 bits
    const total = (byte0 << 16) | (byte1 << 8) | byte2;

    // Extraer la dirección del viento (bits 0-2)
    const wind_direction_int = total & 0x7;

    // Extraer la humedad (bits 3-9)
    const humedad = (total >> 3) & 0x7F;

    // Extraer la temperatura escalada (bits 10-23)
    const temperature_scaled = (total >> 10) & 0x3FFF;

    // Recuperar la temperatura original
    const temperatura = temperature_scaled / 100;

    // Mapear el entero de dirección del viento de vuelta a la cadena
    const reverse_direccion_map = {
        0: 'N',
        1: 'NE',
        2: 'E',
        3: 'SE',
        4: 'S',
        5: 'SO',
        6: 'O',
        7: 'NO',
    };
    const direccion_viento = reverse_direccion_map[wind_direction_int];

    return {
        temperatura: temperatura,
        humedad: humedad,
        direccion_viento: direccion_viento,
    };
}


// Función principal
const run = async () => {
    // Conectar al consumidor
    await consumer.connect();
    console.log('Conectado al consumidor de Kafka');

    // Suscribirse al tópico
    await consumer.subscribe({ topic: '21188', fromBeginning: false });

    // Procesar mensajes entrantes
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const mensaje = message.value; // message.value es un Buffer
            console.log(`Mensaje recibido: ${mensaje.toString('hex')}`);
    
            try {
                // Decodificar el mensaje
                const payload = Decode(mensaje);
                all_temp.push(payload.temperatura);
                all_hume.push(payload.humedad);
                all_wind.push(payload.direccion_viento);

                console.log("Datos codificados exitosamente: ", payload);
    
                // Emitir los datos al cliente a través de Socket.IO
                io.emit('nuevos-datos', {
                    temperatura: payload.temperatura,
                    humedad: payload.humedad,
                    direccion_viento: payload.direccion_viento,
                });
            } catch (error) {
                console.error('Error al decodificar el mensaje:', error.message);
                // Opcionalmente, puedes decidir ignorar el error y continuar
            }
        },
    });    
};

run().catch(console.error);
