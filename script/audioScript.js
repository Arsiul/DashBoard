// Ruta corregida según tu estructura actual (sube un nivel y busca modeloAudio)
const URL = "http://localhost:8000/modeloAudio/";
let recognizer, labelContainer, maxPredictions;

function normalizeClassName(label) {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getStatusClass(label) {
    const normalized = normalizeClassName(label);
    const mapping = {
        "clase1": "detectado-clase1",
        "clase2": "detectado-clase2",
        "alarma": "detectado-clase3",
        "silencio": "detectado-clase4",
        "desconocido": "detectado-clase3"
    };

    return mapping[normalized] || "detectado-clase2";
}

function getActionMessage(label, percent) {
    if (percent > 90) {
        return `¡Perfecto! Se detectó con mucha confianza: ${label} (${percent}%). Haz seguimiento inmediato.`;
    }

    if (percent > 75) {
        return `¡Excelente! Sonido de ${label} detectado con ${percent}% de seguridad. Revisa la acción recomendada.`;
    }

    return `Detectando... El sonido más probable es ${label} con ${percent}%. Espera una validación más clara.`;
}

async function init() {
    const checkpointURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    recognizer = speechCommands.create(
        "BROWSER_FFT",
        undefined,
        checkpointURL,
        metadataURL
    );

    await recognizer.ensureModelLoaded();

    const classLabels = recognizer.wordLabels();
    maxPredictions = classLabels.length;

    labelContainer = document.getElementById("label-container");
    labelContainer.innerHTML = "<div class='prediction-grid'></div>";

    const predictionGrid = labelContainer.querySelector(".prediction-grid");

    recognizer.listen(result => {
        const predictions = classLabels.map((label, index) => {
            const percentage = Math.round(result.scores[index] * 100);
            return { label, percentage };
        });

        const visiblePredictions = predictions.filter(prediction => normalizeClassName(prediction.label) !== "ruido-de-fondo");
        const bestPrediction = visiblePredictions.length > 0
            ? visiblePredictions.reduce((best, current) => current.percentage > best.percentage ? current : best, visiblePredictions[0])
            : { label: "Ruido de fondo", percentage: 0 };

        const statusMessage = visiblePredictions.length > 0
            ? getActionMessage(bestPrediction.label, bestPrediction.percentage)
            : "Se detectó ruido de fondo. Esperando un sonido válido para hacer la clasificación.";

        const statusClass = (visiblePredictions.length > 0 && bestPrediction.percentage > 75) ? "status-success" : "status-wait";
        const cardStateClass = (visiblePredictions.length > 0 && bestPrediction.percentage > 75) ? getStatusClass(bestPrediction.label) : "";

        const predictionsHTML = visiblePredictions.map(prediction => {
            const progressWidth = `${prediction.percentage}%`;
            const isWinner = visiblePredictions.length > 0 && prediction.label === bestPrediction.label;
            const itemClass = isWinner && bestPrediction.percentage > 75 ? `prediction-card detected-high ${cardStateClass}` : "prediction-card";

            return `
                <div class="${itemClass}">
                    <div class="prediction-header">
                        <span class="prediction-label">${prediction.label}</span>
                        <span class="prediction-percentage">${prediction.percentage}%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-bar" style="width: ${progressWidth};"></div>
                    </div>
                </div>
            `;
        }).join("");

        labelContainer.innerHTML = `
            <div class="status-banner ${statusClass}">${statusMessage}</div>
            <div class="prediction-grid">${predictionsHTML}</div>
        `;
    }, {
        includeSpectrogram: true,
        probabilityThreshold: 0.75,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.50
    });
}
