const canvas = document.getElementById('signature-pad');
const ctx = canvas.getContext('2d');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');
const msgBox = document.getElementById('msg-box');
const debugLog = document.getElementById('debug-log');

// Configuração
const configPanel = document.getElementById('config-panel');
const fieldSelector = document.getElementById('field-selector');
const btnSaveConfig = document.getElementById('btn-save-config');
const btnCancelConfig = document.getElementById('btn-cancel-config');
const btnSettings = document.getElementById('btn-settings');
const statusTask = document.getElementById('status-task');
const statusDeal = document.getElementById('status-deal');

let isDrawing = false;
let hasSignature = false;
let currentTaskId = null;
let currentDealId = null;
let targetFieldCode = null;

// --- FERRAMENTA DE LOG (MODO SILENCIOSO) ---
function logToScreen(msg) {
    // Apenas no console do navegador (F12) para não poluir a tela do usuário
    console.log(msg);
}

// --- INICIALIZAÇÃO ---
if (typeof BX24 !== 'undefined') {
    logToScreen("Iniciando BX24...");
    BX24.init(function() {
        
        // >>> LIMPEZA VISUAL <<<
        // 1. Esconde a barra superior (azul)
        if(statusTask && statusTask.parentElement) {
            statusTask.parentElement.style.display = 'none';
        }
        // 2. Garante que o log de debug esteja invisível
        if(debugLog) {
            debugLog.style.display = 'none';
        }

        // --- LÓGICA DO APP (Continua rodando nos bastidores) ---
        const placement = BX24.placement.info();
        logToScreen(`Placement: ${placement.placement}`);

        if (placement.options && placement.options.ID && placement.placement === 'CRM_DEAL_DETAIL_TAB') {
            currentDealId = placement.options.ID;
        } else if (placement.options && placement.options.taskId) {
            currentTaskId = placement.options.taskId;
        }
        
        // Se estiver na Tarefa, tenta descobrir o Deal imediatamente
        if (currentTaskId && !currentDealId) {
            findDealFromTask();
        }

        // Carrega Configuração
        loadAppConfiguration();
    });
} else {
    console.error("ERRO FATAL: BX24 não encontrado.");
}

function findDealFromTask() {
    logToScreen(`Buscando vínculo da tarefa ${currentTaskId}...`);
    BX24.callMethod('tasks.task.get', { taskId: currentTaskId, select: ['UF_CRM_TASK'] }, function(res) {
        if (res.error()) {
            logToScreen("Erro ao ler tarefa: " + res.error());
            return;
        }
        const crmFields = res.data().task.ufCrmTask;
        logToScreen(`Campos CRM da tarefa: ${JSON.stringify(crmFields)}`);
        
        if (crmFields && crmFields.length > 0) {
            const dealStr = crmFields.find(item => item.startsWith('D_'));
            if (dealStr) {
                currentDealId = dealStr.replace('D_', '');
                logToScreen(`Negócio vinculado encontrado: ${currentDealId}`);
            }
        }
    });
}

function loadAppConfiguration() {
    BX24.callMethod('app.option.get', { option: 'signature_target_field' }, function(result) {
        if(result.data()) {
            targetFieldCode = result.data();
            logToScreen(`Campo configurado: ${targetFieldCode}`);
        } else {
            logToScreen("Nenhum campo salvo. Abrindo painel...");
            openConfigPanel();
        }
    });
}

function openConfigPanel() {
    configPanel.style.display = 'flex';
    // Carrega a lista com delay pequeno para garantir auth
    setTimeout(() => loadDealFields(), 500); 
}

function closeConfigPanel() { configPanel.style.display = 'none'; }

// --- CARREGAR CAMPOS ---
window.loadDealFields = function(forceRaw = false) {
    logToScreen("Consultando crm.deal.fields...");
    fieldSelector.innerHTML = '<option>Consultando API...</option>';
    
    BX24.callMethod('crm.deal.fields', {}, function(result) {
        if (result.error()) {
            logToScreen("ERRO API: " + result.error());
            fieldSelector.innerHTML = '<option>Erro na consulta</option>';
            return;
        }

        const fields = result.data(); 
        let optionsHtml = '<option value="">-- Selecione o campo --</option>';
        let count = 0;

        for (let key in fields) {
            if (!key.startsWith('UF_')) continue;

            let fieldData = fields[key];
            let label = fieldData.formLabel || fieldData.listLabel || fieldData.title || key;
            let type = fieldData.type;

            const isFile = (type === 'file' || type === 'disk_file');
            const isString = (type === 'string'); 
            
            if (isFile || isString || forceRaw) {
                let icone = isFile ? '📁' : '📝';
                optionsHtml += `<option value="${key}">${icone} ${label} (${type})</option>`;
                count++;
            }
        }

        if (count === 0) {
            optionsHtml = '<option value="">Nenhum campo compatível (UF_) encontrado!</option>';
        }

        fieldSelector.innerHTML = optionsHtml;
    });
}

btnSaveConfig.addEventListener('click', () => {
    const selected = fieldSelector.value;
    if (!selected) { alert("Selecione um campo."); return; }
    
    BX24.callMethod('app.option.set', { options: { 'signature_target_field': selected } }, function(res) {
        targetFieldCode = selected;
        closeConfigPanel();
        showMessage("Configuração salva!", "success");
    });
});

btnSettings.addEventListener('click', openConfigPanel);
btnCancelConfig.addEventListener('click', closeConfigPanel);

// --- LÓGICA PADRÃO ---
function showMessage(text, type) {
    msgBox.innerHTML = text;
    msgBox.className = type === 'error' ? 'msg-erro' : (type === 'success' ? 'msg-sucesso' : 'msg-info');
}

// Configuração Canvas
ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000000';
function getTouchPos(c, e) { var r = c.getBoundingClientRect(); return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }; }
canvas.addEventListener('mousedown', (e) => { isDrawing = true; hasSignature = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
canvas.addEventListener('mousemove', (e) => { if (!isDrawing) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); });
canvas.addEventListener('mouseup', () => isDrawing = false); canvas.addEventListener('mouseout', () => isDrawing = false);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isDrawing = true; hasSignature = true; const pos = getTouchPos(canvas, e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (!isDrawing) return; const pos = getTouchPos(canvas, e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); }, { passive: false });
canvas.addEventListener('touchend', () => isDrawing = false);
btnClear.addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); hasSignature = false; });

btnSave.addEventListener('click', () => {
    if (!hasSignature) { showMessage("Assine antes.", "error"); return; }
    if (!targetFieldCode) { openConfigPanel(); return; }
    if (!currentDealId) { showMessage("Negócio não identificado.", "error"); return; }

    btnSave.innerText = "ENVIANDO...";
    const content = canvas.toDataURL('image/png').split(',')[1];
    
    let fields = {};
    fields[targetFieldCode] = { "fileData": ["assinatura.png", content] };

    BX24.callMethod('crm.deal.update', { id: currentDealId, fields: fields }, function(res) {
        btnSave.innerText = "SALVAR";
        if (res.error()) { 
            console.error("Erro update: " + res.error()); 
            showMessage("Erro ao salvar.", "error"); 
        }
        else { 
            showMessage("✅ Assinatura salva!", "success"); 
            ctx.clearRect(0,0,340,250); 
            hasSignature = false; 
        }
    });
});
