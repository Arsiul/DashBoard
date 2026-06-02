let recognizer, labelContainer, maxPredictions;

// ✅ RUTA RELATIVA (funciona con Live Server)
const MODEL_PATH = window.location.origin + "/modeloAudio/";

const checkpointURL = MODEL_PATH + "model.json";
const metadataURL = MODEL_PATH + "metadata.json";

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

    recognizer.listen(result => {
        const predictions = classLabels.map((label, index) => ({
            label,
            percentage: Math.round(result.scores[index] * 100)
        }));

        const visiblePredictions = predictions.filter(
            p => normalizeClassName(p.label) !== "ruido-de-fondo"
        );

        const bestPrediction = visiblePredictions.length > 0
            ? visiblePredictions.reduce((best, current) =>
                current.percentage > best.percentage ? current : best
              )
            : { label: "Ruido de fondo", percentage: 0 };

        const statusMessage = visiblePredictions.length > 0
            ? getActionMessage(bestPrediction.label, bestPrediction.percentage)
            : "Se detectó ruido de fondo. Esperando un sonido válido.";

        const statusClass =
            visiblePredictions.length > 0 && bestPrediction.percentage > 75
                ? "status-success"
                : "status-wait";

        const predictionsHTML = visiblePredictions.map(prediction => {
            const isWinner = prediction.label === bestPrediction.label;

            return `
                <div class="prediction-card ${isWinner ? "detected-high" : ""}">
                    <div class="prediction-header">
                        <span class="prediction-label">${prediction.label}</span>
                        <span class="prediction-percentage">${prediction.percentage}%</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-bar" style="width:${prediction.percentage}%"></div>
                    </div>
                </div>
            `;
        }).join("");

        labelContainer.innerHTML = `
            <div class="status-banner ${statusClass}">
                ${statusMessage}
            </div>
            <div class="prediction-grid">
                ${predictionsHTML}
            </div>
        `;
    }, {
        includeSpectrogram: true,
        probabilityThreshold: 0.75,
        invokeCallbackOnNoiseAndUnknown: true,
        overlapFactor: 0.50
    });
}