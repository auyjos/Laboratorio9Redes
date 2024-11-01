const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'weather-sensor',
    brokers: ['lab9.alumchat.lol:9092'],
});

const producer = kafka.producer();

// Función para generar datos simulados
const generarDatos = () => {
    // Generar temperatura (float entre 0 y 110.00)
    const temperatura = (Math.random() * 110).toFixed(2);

    // Generar humedad (entero entre 0 y 100)
    const humedad = Math.floor(Math.random() * 101);

    // Generar dirección del viento
    const direcciones = ['N', 'NO', 'O', 'SO', 'S', 'SE', 'E', 'NE'];
    const direccionViento = direcciones[Math.floor(Math.random() * direcciones.length)];

    return {
        temperatura: parseFloat(temperatura),
        humedad: humedad,
        direccion_viento: direccionViento,
    };
};

const run = async () => {
    await producer.connect();
    console.log('Conectado al productor de Kafka');

    // Enviar datos cada 15 a 30 segundos
    setInterval(async () => {
        const datos = generarDatos();
        const value = JSON.stringify(datos);
        try {
            await producer.send({
                topic: '201579',
                messages: [{ key: 'sensor1', value: value }],
            });
            console.log(`Datos enviados: ${value}`);
        } catch (err) {
            console.error('Error al enviar datos:', err);
        }
    }, Math.floor(Math.random() * (30000 - 15000 + 1) + 15000)); // Intervalo aleatorio entre 15 y 30 segundos
};

run().catch(console.error);
