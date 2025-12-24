const canvas = document.getElementById('signature-pad');
const ctx = canvas.getContext('2d');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');

let isDrawing = false;
let hasSignature = false; // Controle para saber se já assinou

// Configuração do pincel
ctx.lineWidth = 2;
ctx.lineCap = 'round';
ctx.strokeStyle = '#000000';

// --- EVENTOS DE MOUSE (PC) ---
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    hasSignature = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
});

canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

// --- EVENTOS DE TOUCH (CELULAR) ---
// O touch precisa de um cálculo diferente para pegar a posição exata
function getTouchPos(canvasDom, touchEvent) {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: touchEvent.touches[0].clientX - rect.left,
        y: touchEvent.touches[0].clientY - rect.top
    };
}

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Impede a tela de rolar
    isDrawing = true;
    hasSignature = true;
    const pos = getTouchPos(canvas, e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getTouchPos(canvas, e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
}, { passive: false });

canvas.addEventListener('touchend', () => isDrawing = false);

// --- BOTÕES ---

// Botão Limpar
btnClear.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;
});

// Botão Salvar (Por enquanto apenas avisa)
btnSave.addEventListener('click', () => {
    if (!hasSignature) {
        alert("Por favor, assine antes de salvar.");
        return;
    }
    
    // Converte o desenho em imagem (Base64)
    const dataURL = canvas.toDataURL('image/png');
    
    // Feedback visual
    btnSave.innerText = "Enviando...";
    btnSave.disabled = true;

    console.log("Imagem gerada:", dataURL.substring(0, 50) + "..."); // Só para teste
    
    // Simulação de envio (vamos implementar o envio real no próximo passo)
    setTimeout(() => {
        alert("Assinatura capturada! (Pronto para enviar ao Backend)");
        btnSave.innerText = "Salvar";
        btnSave.disabled = false;
    }, 1000);
});
