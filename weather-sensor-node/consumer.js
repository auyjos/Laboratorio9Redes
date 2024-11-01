
const { Kafka } = require('kafkajs');

// Creamos una instancia de Kafka, configurando el cliente
const kafka = new Kafka({
    clientId: 'weather-sensor', // ID del cliente para identificar la aplicación
    brokers: ['lab9.alumchat.lol:9092'], // Lista de brokers Kafka a los que conectarse
});

// Creamos un consumidor, especificando el ID del grupo al que pertenece
const consumer = kafka.consumer({ groupId: 'weather-sensor-group' });

// Función asíncrona principal para ejecutar el consumidor
const run = async () => {
    // Conectamos el consumidor al broker
    await consumer.connect();

    // Nos suscribimos al topic '201579', indicando que queremos recibir mensajes desde el principio
    await consumer.subscribe({ topic: '201579', fromBeginning: true });

    // Configuramos el consumidor para ejecutar una función cada vez que recibe un mensaje
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            // Imprimimos el contenido del mensaje recibido en la consola
            console.log(`Received message: ${message.value.toString()}`);
        },
    });
};

// Llamamos a la función run y manejamos cualquier error que ocurra
run().catch(console.error);
