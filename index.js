// CONFIGURACIÓN DEL SISTEMA MAS
const T_total = 10;  // Duración total de la simulación en segundos
const dt = 0.01;     // Paso de integración
let t = 0;           // Tiempo inicial

// Variables del sistema (condiciones iniciales por defecto)
let x = 1;           // Posición inicial
let v = 0;           // Velocidad inicial
let omega = 2;       // Frecuencia angular

// Arreglos para almacenar las series de tiempo
const timeData = [];
const xData = [];
const vData = [];

// Arreglo para almacenar la trayectoria en el plano de fase (x vs. v)
const trajectoryPhase = [];

// DEFINICIÓN DE LAS ECUACIONES DEL MAS
// Las ecuaciones del MAS son:
// dx/dt = v
// dv/dt = -ω² * x
function f_x(x, v) {
    return v;
}
function f_v(x, v) {
    return -omega * omega * x;
}

// MÉTODO RK4 PARA LA INTEGRACIÓN
function rk4Step(x, v, dt) {
    const k1x = f_x(x, v);
    const k1v = f_v(x, v);

    const k2x = f_x(x + 0.5 * k1x * dt, v + 0.5 * k1v * dt);
    const k2v = f_v(x + 0.5 * k1x * dt, v + 0.5 * k1v * dt);

    const k3x = f_x(x + 0.5 * k2x * dt, v + 0.5 * k2v * dt);
    const k3v = f_v(x + 0.5 * k2x * dt, v + 0.5 * k2v * dt);

    const k4x = f_x(x + k3x * dt, v + k3v * dt);
    const k4v = f_v(x + k3x * dt, v + k3v * dt);

    const newX = x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x);
    const newV = v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v);
    return { x: newX, v: newV };
}

// CONFIGURACIÓN DE LOS CANVAS Y FUNCIONES DE DIBUJO
const timeCanvas = document.getElementById('timeCanvas');
const timeCtx = timeCanvas.getContext('2d');
const phaseCanvas = document.getElementById('phaseCanvas');
const phaseCtx = phaseCanvas.getContext('2d');

// Para el plano de fase, definimos un rango para (x, v)
const phaseRange = { xMin: -3, xMax: 3, yMin: -3, yMax: 3 };
function phaseToPixelX(val) {
    return ((val - phaseRange.xMin) / (phaseRange.xMax - phaseRange.xMin)) * phaseCanvas.width;
}
function phaseToPixelY(val) {
    // El eje Y se invierte en el canvas
    return phaseCanvas.height - ((val - phaseRange.yMin) / (phaseRange.yMax - phaseRange.yMin)) * phaseCanvas.height;
}

// Dibuja el campo vectorial en el plano de fase
function drawVectorField() {
    phaseCtx.clearRect(0, 0, phaseCanvas.width, phaseCanvas.height);

    // Dibujo de ejes
    phaseCtx.strokeStyle = "#aaa";
    phaseCtx.beginPath();
    // Eje x
    phaseCtx.moveTo(0, phaseToPixelY(0));
    phaseCtx.lineTo(phaseCanvas.width, phaseToPixelY(0));
    // Eje v (vertical)
    phaseCtx.moveTo(phaseToPixelX(0), 0);
    phaseCtx.lineTo(phaseToPixelX(0), phaseCanvas.height);
    phaseCtx.stroke();
    phaseCtx.fillStyle = "#ccc";
    phaseCtx.font = "12px sans-serif";

    for (let i = phaseRange.xMin; i <= phaseRange.xMax; i++) {
        const px = phaseToPixelX(i);
        phaseCtx.fillText(i.toString(), px + 2, phaseToPixelY(0) + 12); // etiquetas en eje x
    }
    for (let j = phaseRange.yMin; j <= phaseRange.yMax; j++) {
        const py = phaseToPixelY(j);
        phaseCtx.fillText(j.toString(), phaseToPixelX(0) + 4, py - 4); // etiquetas en eje y
    }

    // Configuración de la malla
    const separation = 0.25;
    const arrowSize = 0.2;
    for (let ix = phaseRange.xMin; ix <= phaseRange.xMax; ix += separation) {
        for (let iv = phaseRange.yMin; iv <= phaseRange.yMax; iv += separation) {
            // Calcula las derivadas en (ix, iv)
            let dx = f_x(ix, iv);
            let dv = f_v(ix, iv);
            // Normaliza el vector
            const mag = Math.hypot(dx, dv);
            if (mag > 0) {
                dx /= mag;
                dv /= mag;
            }
            // Escala el vector para el dibujo
            dx = dx * arrowSize;
            dv = dv * arrowSize;

            // Coordenadas de inicio y fin
            const startX = phaseToPixelX(ix);
            const startY = phaseToPixelY(iv);
            const endX = phaseToPixelX(ix + dx);
            const endY = phaseToPixelY(iv + dv);

            // Dibuja la línea de la flecha
            phaseCtx.strokeStyle = "#8080ff";
            phaseCtx.lineWidth = 1;
            phaseCtx.beginPath();
            phaseCtx.moveTo(startX, startY);
            phaseCtx.lineTo(endX, endY);
            phaseCtx.stroke();

            // Dibuja la cabeza de la flecha
            const angle = Math.atan2(endY - startY, endX - startX);
            const headLength = 4;
            phaseCtx.beginPath();
            phaseCtx.moveTo(endX, endY);
            phaseCtx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6),
                endY - headLength * Math.sin(angle - Math.PI / 6));
            phaseCtx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6),
                endY - headLength * Math.sin(angle + Math.PI / 6));
            phaseCtx.lineTo(endX, endY);
            phaseCtx.fillStyle = "#8080ff";
            phaseCtx.fill();
        }
    }
}

// Dibuja la trayectoria en el plano de fase
function drawPhaseTrajectory() {
    phaseCtx.strokeStyle = "#e74c3c";
    phaseCtx.lineWidth = 2;
    phaseCtx.beginPath();
    trajectoryPhase.forEach((pt, i) => {
        const px = phaseToPixelX(pt.x);
        const py = phaseToPixelY(pt.v);
        if (i === 0) phaseCtx.moveTo(px, py);
        else phaseCtx.lineTo(px, py);
    });
    phaseCtx.stroke();
}

// Dibuja las series de tiempo: x(t) en rojo y v(t) en azul
function drawTimeSeries() {
    timeCtx.clearRect(0, 0, timeCanvas.width, timeCanvas.height);

    // Dibuja ejes
    timeCtx.strokeStyle = "#aaa";
    timeCtx.beginPath();
    timeCtx.moveTo(40, timeCanvas.height - 20);
    timeCtx.lineTo(timeCanvas.width - 10, timeCanvas.height - 20);
    timeCtx.moveTo(40, 10);
    timeCtx.lineTo(40, timeCanvas.height - 20);
    timeCtx.stroke();

    const tMin = 0, tMax = T_total;
    const vMin = -3, vMax = 3; //Rango para los valores (asumimos que x y v están en [-3,3])

    //Marcas y etiquetas en el eje X (Tiempo)
    timeCtx.fillStyle = "#ccc";
    timeCtx.font = "12px sans-serif";
    const numXTicks = 5;
    for (let i = 0; i <= numXTicks; i++) {
        let t_val = tMin + i * (tMax - tMin) / numXTicks;
        let px = 40 + ((t_val - tMin) / (tMax - tMin)) * (timeCanvas.width - 50);
        // Dibujar un tick (opcional)
        timeCtx.beginPath();
        timeCtx.moveTo(px, timeCanvas.height - 20);
        timeCtx.lineTo(px, timeCanvas.height - 15);
        timeCtx.stroke();
        // Etiqueta
        timeCtx.fillText(t_val.toFixed(2), px - 10, timeCanvas.height - 5);
    }

    //Marcas y etiquetas en el eje Y (velocidad)
    const numYTicks = 5;
    for (let j = 0; j <= numYTicks; j++) {
        let v_val = vMin + j * (vMax - vMin) / numYTicks;
        let py = timeCanvas.height - 20 - ((v_val - vMin) / (vMax - vMin)) * (timeCanvas.height - 30);
        // Dibujar un tick horizontal (opcional)
        timeCtx.beginPath();
        timeCtx.moveTo(35, py);
        timeCtx.lineTo(40, py);
        timeCtx.stroke();
        // Etiqueta
        timeCtx.fillText(v_val.toFixed(1), 5, py + 4);
    }

    // Graficar x(t) en rojo
    timeCtx.strokeStyle = "#ff6b6b";
    timeCtx.beginPath();
    timeData.forEach((t_val, i) => {
        const px = 40 + ((t_val - tMin) / (tMax - tMin)) * (timeCanvas.width - 50);
        const py = timeCanvas.height - 20 - ((xData[i] - vMin) / (vMax - vMin)) * (timeCanvas.height - 30);
        if (i === 0) timeCtx.moveTo(px, py);
        else timeCtx.lineTo(px, py);
    });
    timeCtx.stroke();

    // Graficar v(t) en azul
    timeCtx.strokeStyle = "#4db8ff";
    timeCtx.beginPath();
    timeData.forEach((t_val, i) => {
        const px = 40 + ((t_val - tMin) / (tMax - tMin)) * (timeCanvas.width - 50);
        const py = timeCanvas.height - 20 - ((vData[i] - vMin) / (vMax - vMin)) * (timeCanvas.height - 30);
        if (i === 0) timeCtx.moveTo(px, py);
        else timeCtx.lineTo(px, py);
    });
    timeCtx.stroke();

    // Etiqueta del eje t
    timeCtx.fillStyle = "#000";
    timeCtx.font = "12px sans-serif";
    timeCtx.fillText("t", timeCanvas.width - 20, timeCanvas.height - 15);
}

// ACTUALIZACIÓN DE DATOS EN LA CALCULADORA
function updateCalculator() {
    const m = 1;
    const k = m * omega * omega;
    document.getElementById("currentX").innerText = x.toFixed(2);
    document.getElementById("currentV").innerText = v.toFixed(2);
    document.getElementById("potentialE").innerText = (0.5 * k * x * x).toFixed(2);
    document.getElementById("kineticE").innerText = (0.5 * m * v * v).toFixed(2);
}

// FUNCIÓN PARA REINICIALIZAR LA SIMULACIÓN CON NUEVOS PARÁMETROS
function setParameters() {
    x = parseFloat(document.getElementById("x0").value);
    v = parseFloat(document.getElementById("v0").value);
    omega = parseFloat(document.getElementById("omega").value);
    t = 0;

    // Reiniciamos los arreglos de datos
    timeData.splice(0, timeData.length);
    xData.splice(0, xData.length);
    vData.splice(0, vData.length);
    trajectoryPhase.splice(0, trajectoryPhase.length);

    timeData.push(t);
    xData.push(x);
    vData.push(v);
    trajectoryPhase.push({ x: x, v: v });

    // Actualiza el periodo calculado (T = 2π/ω)
    document.getElementById("period").innerText = (2 * Math.PI / omega).toFixed(2);
}

// Inicializamos la simulación con los parámetros por defecto
setParameters();

let isRunning = true;

function toggleSim() {
    isRunning = !isRunning;
    document.getElementById("pauseBtn").textContent = isRunning ? "Pausar" : "Reanudar";
}

// BUCLE DE SIMULACIÓN
function simulate() {
    if (isRunning && t < T_total) {
        const result = rk4Step(x, v, dt);
        x = result.x;
        v = result.v;
        t += dt;
        timeData.push(t);
        xData.push(x);
        vData.push(v);
        trajectoryPhase.push({ x: x, v: v });
    }

    drawVectorField();
    drawPhaseTrajectory();
    drawTimeSeries();
    updateCalculator();

    requestAnimationFrame(simulate);
}

simulate();

function cargarVTVT() {
    const contenedor = document.getElementById("contenedorVTVT");
    contenedor.innerHTML = `
      <iframe src="vtvt.html" frameborder="0" width="100%" height="820px" background: #1a1a1a;" title="vtvt demo"></iframe>`;
}