const canvas = document.getElementById('signature-pad');
const ctx = canvas.getContext('2d');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');

let isDrawing = false;
let hasSignature = false;
let currentTaskId = null; // Vai guardar o ID da tarefa
let currentAuth = null;   // Vai guardar o Token de acesso

// --- INICIALIZAÇÃO DO BITRIX ---
// Isso roda assim que o app abre dentro da aba
if (typeof BX24 !== 'undefined') {
    BX24.init(function() {
        // Pega as informações de onde o app está (Contexto)
        const placement = BX24.placement.info();
        currentAuth = BX24.getAuth(); // Pega o token para usar no backend

        console.log("Contexto do App:", placement);
        console.log("Auth:", currentAuth);

        // Tenta descobrir o ID da tarefa dependendo de onde abriu
        if (placement.options && placement.options.taskId) {
            currentTaskId = placement.options.taskId;
            console.log("ID da Tarefa detectado:", currentTaskId);
        } else if (placement.options && placement.options.ID) {
            // As vezes o Bitrix manda como ID
            currentTaskId = placement.options.ID;
            console.log("ID detectado:", currentTaskId);
        }
    });
} else {
    console.warn("Biblioteca BX24 não encontrada (Teste fora do Bitrix?)");
}

// --- CONFIGURAÇÃO DO DESENHO (Igual ao anterior) ---
ctx.lineWidth = 2;
ctx.lineCap = 'round';
ctx.strokeStyle = '#000000';

function getTouchPos(canvasDom, touchEvent) {
    var rect = canvasDom.getBoundingClientRect();
    return {
        x: touchEvent.touches[0].clientX - rect.left,
        y: touchEvent.touches[0].clientY - rect.top
    };
}

// Eventos Mouse
canvas.addEventListener('mousedown', (e) => {
    isDrawing = true; hasSignature = true;
    ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY);
});
canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke();
});
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

// Eventos Touch
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); isDrawing = true; hasSignature = true;
    const pos = getTouchPos(canvas, e);
    ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
}, { passive: false });
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); if (!isDrawing) return;
    const pos = getTouchPos(canvas, e);
    ctx.lineTo(pos.x, pos.y); ctx.stroke();
}, { passive: false });
canvas.addEventListener('touchend', () => isDrawing = false);

// --- BOTÕES ---

btnClear.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;
});

btnSave.addEventListener('click', async () => {
    if (!hasSignature) {
        alert("Por favor, assine antes de salvar.");
        return;
    }
    
    // Feedback visual
    const originalText = btnSave.innerText;
    btnSave.innerText = "Enviando...";
    btnSave.disabled = true;

    const imageBase64 = canvas.toDataURL('image/png');

    try {
        // Envia TUDO para o backend: Imagem + ID da Tarefa + Tokens
        const response = await fetch('/api/save-signature', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                imageBase64: imageBase64,
                taskId: currentTaskId, // Aqui vai o ID importante
                auth: currentAuth      // Aqui vai a chave do cofre
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            alert("Sucesso! Assinatura salva.");
            // Opcional: Fechar o slider lateral do Bitrix após salvar
            if(typeof BX24 !== 'undefined') BX24.closeApplication();
        } else {
            alert("Erro no servidor: " + (data.error || 'Desconhecido'));
        }

    } catch (error) {
        console.error(error);
        alert("Erro de conexão.");
    } finally {
        btnSave.innerText = originalText;
        btnSave.disabled = false;
    }
});
