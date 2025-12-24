const canvas = document.getElementById('signature-pad');
const ctx = canvas.getContext('2d');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');
const msgBox = document.getElementById('msg-box'); // Pegamos a caixa de mensagem

let isDrawing = false;
let hasSignature = false;
let currentTaskId = null;

// --- FUNÇÃO PARA EXIBIR MENSAGENS NA TELA ---
function showMessage(text, type) {
    msgBox.innerHTML = text;
    msgBox.className = ''; // Reseta classes anteriores
    
    if (type === 'error') msgBox.classList.add('msg-erro');
    else if (type === 'success') msgBox.classList.add('msg-sucesso');
    else msgBox.classList.add('msg-info');
}

// --- INICIALIZAÇÃO BITRIX ---
if (typeof BX24 !== 'undefined') {
    BX24.init(function() {
        const placement = BX24.placement.info();
        if (placement.options && placement.options.taskId) {
            currentTaskId = placement.options.taskId;
        } else if (placement.options && placement.options.ID) {
            currentTaskId = placement.options.ID;
        }
    });
}

// --- CONFIGURAÇÃO DO DESENHO ---
ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000000';

function getTouchPos(canvasDom, touchEvent) {
    var rect = canvasDom.getBoundingClientRect();
    return { x: touchEvent.touches[0].clientX - rect.left, y: touchEvent.touches[0].clientY - rect.top };
}

// Eventos
canvas.addEventListener('mousedown', (e) => { isDrawing = true; hasSignature = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); showMessage("", "info"); }); // Limpa mensagem ao começar a desenhar
canvas.addEventListener('mousemove', (e) => { if (!isDrawing) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); });
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isDrawing = true; hasSignature = true; const pos = getTouchPos(canvas, e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); showMessage("", "info"); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (!isDrawing) return; const pos = getTouchPos(canvas, e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); }, { passive: false });
canvas.addEventListener('touchend', () => isDrawing = false);

// --- BOTÕES ---

btnClear.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;
    showMessage("", "info"); // Limpa mensagens
});

btnSave.addEventListener('click', () => {
    // 1. Validação: Tem desenho?
    if (!hasSignature) {
        showMessage("Por favor, faça a assinatura antes de salvar.", "error");
        return;
    }
    
    // 2. Validação: Tem ID da Tarefa?
    if (!currentTaskId) {
        showMessage("Erro: Não encontrei a Tarefa. Atualize a página (F5).", "error");
        return;
    }

    // Feedback visual (Carregando)
    btnSave.disabled = true;
    btnSave.innerText = "ENVIANDO...";
    showMessage("Anexando assinatura à tarefa...", "info");

    const imageBase64 = canvas.toDataURL('image/png');
    const content = imageBase64.split(',')[1]; 

    // Envio para o Bitrix
    BX24.callMethod(
        'task.item.addfile', 
        {
            TASK_ID: currentTaskId,
            FILE: { NAME: "assinatura_os.png", CONTENT: content }
        },
        function(result) {
            btnSave.disabled = false;
            btnSave.innerText = "SALVAR ASSINATURA";

            if (result.error()) {
                console.error(result.error());
                // Mostra o erro na tela (vermelho)
                showMessage("Erro ao salvar: " + result.error().ex.error_description, "error");
            } else {
                // Sucesso (verde)
                showMessage("✅ Sucesso! Assinatura salva na tarefa.", "success");
                
                // Limpa tudo para nova assinatura
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                hasSignature = false;
            }
        }
    );
});
