const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'weather-sensor',
    brokers: ['lab9.alumchat.lol:9092'],
});

const producer = kafka.producer();

// Función para generar números aleatorios con distribución normal
function generateRandomNormal(mean, stdDev) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return num * stdDev + mean;
}

// Variables de estado para temperatura y humedad
let temperaturaActual = 25;
let humedadActual = 50;

// Función para generar datos simulados
const generarDatos = () => {
    // Definir desviación estándar para las variaciones
    const temperaturaDesviacion = 0.5;
    const humedadDesviacion = 1;

    // Generar variación aleatoria para temperatura
    let variacionTemperatura = generateRandomNormal(0, temperaturaDesviacion);
    temperaturaActual += variacionTemperatura;

    // Asegurar que la temperatura esté dentro del rango [0, 110]
    temperaturaActual = Math.max(0, Math.min(110, temperaturaActual));
    let temperatura = parseFloat(temperaturaActual.toFixed(2));

    // Generar variación aleatoria para humedad
    let variacionHumedad = generateRandomNormal(0, humedadDesviacion);
    humedadActual += variacionHumedad;

    // Asegurar que la humedad esté dentro del rango [0, 100]
    humedadActual = Math.max(0, Math.min(100, humedadActual));
    let humedad = Math.round(humedadActual);

    // Generar dirección del viento
    const direcciones = ['N', 'NO', 'O', 'SO', 'S', 'SE', 'E', 'NE'];
    const direccionViento = direcciones[Math.floor(Math.random() * direcciones.length)];

    return {
        temperatura: temperatura,
        humedad: humedad,
        direccion_viento: direccionViento,
    };
};

function Encode(data) {
    // Mapear la dirección del viento a un entero de 3 bits
    const direccion_map = {
        'N': 0,
        'NE': 1,
        'E': 2,
        'SE': 3,
        'S': 4,
        'SO': 5,
        'O': 6,
        'NO': 7,
    };
    const wind_direction = direccion_map[data.direccion_viento];

    // Escalar la temperatura (multiplicar por 100 y redondear)
    const temperature_scaled = Math.round(data.temperatura * 100); // Rango 0 - 11000

    // Verificar que la temperatura cabe en 14 bits
    if (temperature_scaled < 0 || temperature_scaled > 16383) {
        throw new Error('Temperatura fuera de rango para codificación');
    }

    // Verificar que la humedad cabe en 7 bits
    if (data.humedad < 0 || data.humedad > 127) {
        throw new Error('Humedad fuera de rango para codificación');
    }

    // Combinar los bits: temperatura (14 bits), humedad (7 bits), dirección del viento (3 bits)
    const total = (temperature_scaled << 10) | (data.humedad << 3) | wind_direction;

    // Extraer los bytes
    const byte0 = (total >> 16) & 0xFF;
    const byte1 = (total >> 8) & 0xFF;
    const byte2 = total & 0xFF;

    // Crear un Buffer de 3 bytes
    return Buffer.from([byte0, byte1, byte2]);
}


const run = async () => {
    await producer.connect();
    console.log('Conectado al productor de Kafka');

    // Enviar datos cada 15 a 30 segundos
    setInterval(async () => {
        const datos = generarDatos();
        const value = Encode(datos);
        try {
            await producer.send({
                topic: '21188',
                messages: [{ key: 'sensor1', value: value }],
            });
            console.log(`Datos enviados: Temperatura=${datos.temperatura}, Humedad=${datos.humedad}, Dirección del viento=${datos.direccion_viento}`);
        } catch (err) {
            console.error('Error al enviar datos:', err);
        }
    }, Math.floor(Math.random() * (30000 - 15000 + 1) + 15000)); // Intervalo aleatorio entre 15 y 30 segundos
};


run().catch(console.error);
