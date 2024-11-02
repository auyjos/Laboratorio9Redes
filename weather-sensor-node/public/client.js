// Conexión con el servidor Socket.IO
const socket = io();

// Arreglos para almacenar los datos
let etiquetas = [];
let datosTemperatura = [];
let datosHumedad = [];

// Contador para las direcciones del viento
let conteoDirecciones = {
    'N': 0,
    'NO': 0,
    'O': 0,
    'SO': 0,
    'S': 0,
    'SE': 0,
    'E': 0,
    'NE': 0,
};


// Configuración de la gráfica de temperatura
const ctxTemp = document.getElementById('temperaturaChart').getContext('2d');
const temperaturaChart = new Chart(ctxTemp, {
    type: 'line',
    data: {
        labels: etiquetas,
        datasets: [{
            label: 'Temperatura (°C)',
            data: datosTemperatura,
            borderColor: '#ff6384',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
            tension: 0.1,
        }],
    },
    options: {
        plugins: {
            title: {
                display: true,
                text: 'Variación de la Temperatura',
                font: {
                    size: 20,
                },
            },
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                title: { display: true, text: 'Tiempo' },
            },
            y: {
                title: { display: true, text: 'Temperatura (°C)' },
                suggestedMin: 20,
                suggestedMax: 30,
            },
        },
    },
});



// Configuración de la gráfica de humedad
const ctxHume = document.getElementById('humedadChart').getContext('2d');
const humedadChart = new Chart(ctxHume, {
    type: 'line',
    data: {
        labels: etiquetas,
        datasets: [{
            label: 'Humedad (%)',
            data: datosHumedad,
            borderColor: '#36a2eb',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
            tension: 0.1,
        }],
    },
    options: {
        plugins: {
            title: {
                display: true,
                text: 'Variación de la Humedad Relativa',
                font: {
                    size: 20,
                },
            },
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                title: { display: true, text: 'Tiempo' },
            },
            y: {
                title: { display: true, text: 'Humedad (%)' },
                suggestedMin: 40,
                suggestedMax: 50,
            },
        },
    },
});


// Configuración de la gráfica de direcciones del viento
const ctxWind = document.getElementById('direccionVientoChart').getContext('2d');
const direccionVientoChart = new Chart(ctxWind, {
    type: 'bar',
    data: {
        labels: Object.keys(conteoDirecciones),
        datasets: [{
            label: 'Direcciones del Viento',
            data: Object.values(conteoDirecciones),
            backgroundColor: [
                '#ff6384',
                '#36a2eb',
                '#cc65fe',
                '#ffce56',
                '#4bc0c0',
                '#9966ff',
                '#ff9f40',
                '#c9cbcf',
            ],
        }],
    },
    options: {
        plugins: {
            title: {
                display: true,
                text: 'Frecuencia de las Direcciones del Viento',
                font: {
                    size: 20,
                },
            },
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                title: { display: true, text: 'Dirección del Viento' },
            },
            y: {
                title: { display: true, text: 'Conteo' },
                beginAtZero: true,
                precision: 0,
            },
        },
    },
});



// Escuchar el evento 'nuevos-datos' desde el servidor
socket.on('nuevos-datos', (data) => {
    const timestamp = new Date().toLocaleTimeString();

    // Agregar datos a los arreglos
    etiquetas.push(timestamp);
    datosTemperatura.push(data.temperatura);
    datosHumedad.push(data.humedad);

    // Limitar el número de puntos en la gráfica
    const maxPuntos = 20;
    if (etiquetas.length > maxPuntos) {
        etiquetas.shift();
        datosTemperatura.shift();
        datosHumedad.shift();
    }

    // Actualizar las gráficas
    temperaturaChart.update();
    humedadChart.update();

    // Actualizar el contador de direcciones del viento
    const direccion = data.direccion_viento;
    if (conteoDirecciones.hasOwnProperty(direccion)) {
        conteoDirecciones[direccion]++;
    } else {
        // En caso de que haya una dirección inesperada
        conteoDirecciones[direccion] = 1;
        // Actualizar las etiquetas y datos de la gráfica
        direccionVientoChart.data.labels.push(direccion);
    }

    // Actualizar los datos de la gráfica de direcciones del viento
    direccionVientoChart.data.datasets[0].data = Object.values(conteoDirecciones);

    // Actualizar la gráfica de direcciones del viento
    direccionVientoChart.update();
});
