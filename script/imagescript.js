let model;

let webcamActiva = false;

let streamCamara = null;

// ======================
// ELEMENTOS HTML
// ======================

const fileInput =
    document.getElementById(
        "fileInput"
    );

const preview =
    document.getElementById(
        "preview"
    );

const resultado =
    document.getElementById(
        "resultado"
    );

const webcam =
    document.getElementById(
        "webcam"
    );

const btnCamara =
    document.getElementById(
        "btnCamara"
    );

const btnApagarCamara =
    document.getElementById(
        "btnApagarCamara"
    );

const confidenceBar =
    document.getElementById(
        "confidenceBar"
    );

const historyList =
    document.getElementById(
        "historyList"
    );

// ======================
// CARGAR MODELO
// ======================

async function cargarModelo() {

    try {

        resultado.innerHTML =
            "Cargando modelo IA...";

        const modelURL =
            "../modeloclasification/model.json";

        const metadataURL =
            "../modeloclasification/metadata.json";

        model =
            await tmImage.load(
                modelURL,
                metadataURL
            );

        resultado.innerHTML =
            "Modelo cargado correctamente";

        console.log(
            "Modelo cargado"
        );

    } catch(error) {

        console.error(error);

        resultado.innerHTML =
            "Error al cargar modelo";

    }
}

cargarModelo();

// ======================
// SUBIR IMAGEN
// ======================

fileInput.addEventListener(
    "change",
    async (event) => {

        const file =
            event.target.files[0];

        if(!file) return;

        preview.src =
            URL.createObjectURL(file);

        preview.onload =
        async () => {

            if(!model){

                alert(
                    "Modelo aún no cargado"
                );

                return;
            }

            const predictions =
                await model.predict(
                    preview
                );

            mostrarResultado(
                predictions
            );
        };
    }
);

// ======================
// ENCENDER CAMARA
// ======================

async function iniciarCamara() {

    if(webcamActiva) return;

    try {

        streamCamara =
            await navigator
            .mediaDevices
            .getUserMedia({

                video:true

            });

        webcam.srcObject =
            streamCamara;

        webcam.style.display =
            "block";

        webcam.onloadedmetadata =
        () => {

            webcamActiva = true;

            detectarTiempoReal();

        };

    } catch(error) {

        console.error(error);

        resultado.innerHTML =
            "No se pudo acceder a la cámara";
    }
}

// ======================
// APAGAR CAMARA
// ======================

function apagarCamara() {

    webcamActiva = false;

    if(streamCamara){

        streamCamara
            .getTracks()
            .forEach(track => {

                track.stop();

            });

        streamCamara = null;
    }

    webcam.srcObject = null;

    confidenceBar.style.width =
        "0%";

    resultado.innerHTML =
        "Cámara apagada";
}

// ======================
// DETECCION CONTINUA
// ======================

async function detectarTiempoReal() {

    if(!webcamActiva) return;

    if(!model) return;

    try {

        const predictions =
            await model.predict(
                webcam
            );

        mostrarResultado(
            predictions
        );

    } catch(error) {

        console.error(error);

    }

    requestAnimationFrame(
        detectarTiempoReal
    );
}

// ======================
// ICONOS
// ======================

function obtenerIcono(clase) {

    const texto =
        clase.toLowerCase();

    if(
        texto.includes(
            "plast"
        )
    ){
        return "";
    }

    if(
        texto.includes(
            "pap"
        )
    ){
        return "";
    }

    if(
        texto.includes(
            "vid"
        )
    ){
        return "";
    }

    if(
        texto.includes(
            "metal"
        )
    ){
        return "";
    }

    if(
        texto.includes(
            "carton"
        )
    ){
        return "";
    }

    return "";
}

// ======================
// RESULTADO
// ======================

function mostrarResultado(
    predictions
){

    predictions.sort(
        (a,b) =>
            b.probability -
            a.probability
    );

    const mejorClase =
        predictions[0].className;

    const mejorProbabilidad =
        predictions[0].probability;

    confidenceBar.style.width =
        `${mejorProbabilidad * 100}%`;

    resultado.innerHTML = `

        <div>

            <div
            style="
                font-size:4rem;
            ">
                ${obtenerIcono(
                    mejorClase
                )}
            </div>

            <div
            style="
                font-size:1.7rem;
                margin-top:10px;
            ">
                ${mejorClase}
            </div>

            <div
            style="
                margin-top:8px;
                font-size:1.1rem;
            ">
                Confianza:
                ${(mejorProbabilidad * 100)
                    .toFixed(2)}%
            </div>

        </div>

    `;

    actualizarHistorial(
        mejorClase,
        mejorProbabilidad
    );
}

// ======================
// HISTORIAL
// ======================

let ultimaClase = "";

function actualizarHistorial(
    clase,
    probabilidad
){

    if(
        clase === ultimaClase
    ){
        return;
    }

    ultimaClase = clase;

    const item =
        document.createElement(
            "li"
        );

    item.innerHTML = `

        ${obtenerIcono(
            clase
        )}

        ${clase}

        -
        ${(probabilidad * 100)
            .toFixed(1)}%

    `;

    historyList.prepend(
        item
    );

    while(
        historyList.children
            .length > 5
    ){

        historyList.removeChild(
            historyList.lastChild
        );
    }
}

// ======================
// EVENTOS
// ======================

btnCamara.addEventListener(
    "click",
    iniciarCamara
);

btnApagarCamara.addEventListener(
    "click",
    apagarCamara
);
