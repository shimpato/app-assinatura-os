const canvas = document.getElementById('signature-pad');
const ctx = canvas.getContext('2d');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');

let isDrawing = false;
let hasSignature = false;

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
function getTouchPos(canvasDom, touchEvent) {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: touchEvent.touches[0].clientX - rect.left,
        y: touchEvent.touches[0].clientY - rect.top
    };
}

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
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

// Botão Salvar (CONECTADO AO BACKEND)
btnSave.addEventListener('click', async () => {
    if (!hasSignature) {
        alert("Por favor, assine antes de salvar.");
        return;
    }
    
    // Feedback visual
    const originalText = btnSave.innerText;
    btnSave.innerText = "Enviando...";
    btnSave.disabled = true;

    // Pega a imagem em formato texto (Base64)
    const imageBase64 = canvas.toDataURL('image/png');

    try {
        // Envia para o nosso servidor na Vercel
        const response = await fetch('/api/save-signature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                imageBase64: imageBase64,
                placementInfo: 'Teste Manual - Sem Bitrix ainda' 
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert("Sucesso! O servidor recebeu a assinatura.");
            console.log("Resposta do servidor:", data);
        } else {
            alert("Erro ao salvar: " + (data.error || 'Erro desconhecido'));
        }

    } catch (error) {
        console.error(error);
        alert("Erro de conexão. Verifique o console.");
    } finally {
        // Restaura o botão
        btnSave.innerText = originalText;
        btnSave.disabled = false;
    }
});
