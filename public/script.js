const canvas = document.getElementById('signature-pad');
const ctx = canvas.getContext('2d');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');

let isDrawing = false;
let hasSignature = false;
let currentTaskId = null;

// --- INICIALIZAÇÃO BITRIX ---
if (typeof BX24 !== 'undefined') {
    BX24.init(function() {
        const placement = BX24.placement.info();
        console.log("Contexto:", placement);
        
        // Tenta pegar o ID da Tarefa
        if (placement.options && placement.options.taskId) {
            currentTaskId = placement.options.taskId;
        } else if (placement.options && placement.options.ID) {
            currentTaskId = placement.options.ID;
        }
    });
}

// --- CONFIGURAÇÃO DO DESENHO ---
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

// Eventos de Desenho
canvas.addEventListener('mousedown', (e) => { isDrawing = true; hasSignature = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
canvas.addEventListener('mousemove', (e) => { if (!isDrawing) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); });
canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);

canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isDrawing = true; hasSignature = true; const pos = getTouchPos(canvas, e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (!isDrawing) return; const pos = getTouchPos(canvas, e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); }, { passive: false });
canvas.addEventListener('touchend', () => isDrawing = false);

// --- BOTÕES ---

btnClear.addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasSignature = false;
});

btnSave.addEventListener('click', () => {
    if (!hasSignature) {
        alert("Por favor, assine antes de salvar.");
        return;
    }
    
    if (!currentTaskId) {
        alert("Erro: Não consegui identificar o ID da Tarefa. Atualize a página e tente novamente.");
        return;
    }

    // Feedback visual
    const originalText = btnSave.innerText;
    btnSave.innerText = "Salvando...";
    btnSave.disabled = true;

    // Pega a imagem (Base64) e remove o cabeçalho
    const imageBase64 = canvas.toDataURL('image/png');
    const content = imageBase64.split(',')[1]; 

    // --- CORREÇÃO: Usando o método task.item.addfile ---
    // Este método é mais simples e aceita o arquivo direto (sem precisar subir pro disco antes)
    BX24.callMethod(
        'task.item.addfile', 
        {
            TASK_ID: currentTaskId,
            FILE: { 
                NAME: "assinatura_cliente.png", 
                CONTENT: content 
            }
        },
        function(result) {
            btnSave.innerText = originalText;
            btnSave.disabled = false;

            if (result.error()) {
                console.error(result.error());
                alert("Erro ao salvar: " + result.error().ex.error_description); // Mostra o erro detalhado
            } else {
                alert("Sucesso! Assinatura anexada à tarefa.");
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                hasSignature = false;
                // BX24.closeApplication(); // Se quiser fechar após salvar
            }
        }
    );
});
