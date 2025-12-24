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

// --- FERRAMENTA DE LOG ---
function logToScreen(msg) {
    console.log(msg);
    debugLog.style.display = 'block';
    debugLog.innerHTML += `> ${msg}\n`;
}

// --- INICIALIZAÇÃO ---
if (typeof BX24 !== 'undefined') {
    logToScreen("Iniciando BX24...");
    BX24.init(function() {
        // 1. Onde estou?
        const placement = BX24.placement.info();
        logToScreen(`Placement: ${placement.placement}`);

        if (placement.options && placement.options.ID && placement.placement === 'CRM_DEAL_DETAIL_TAB') {
            currentDealId = placement.options.ID;
        } else if (placement.options && placement.options.taskId) {
            currentTaskId = placement.options.taskId;
        }
        
        // Atualiza barra visual
        statusTask.innerText = `Tarefa: ${currentTaskId || 'N/A'}`;
        statusDeal.innerText = `Negócio: ${currentDealId || 'Procurando...'}`;

        if(!currentTaskId && !currentDealId) {
            logToScreen("ALERTA: Não consegui identificar ID nem da Tarefa nem do Negócio.");
        }

        // 2. Se estiver na Tarefa, tenta descobrir o Deal imediatamente
        if (currentTaskId && !currentDealId) {
            findDealFromTask();
        }

        // 3. Carrega Configuração
        loadAppConfiguration();
    });
} else {
    logToScreen("ERRO FATAL: BX24 não encontrado.");
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
                statusDeal.innerText = `Negócio: #${currentDealId}`;
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

// --- CARREGAR CAMPOS (COM LÓGICA MELHORADA DO APP CNPJ) ---
window.loadDealFields = function(forceRaw = false) {
    logToScreen("Consultando crm.deal.userfield.list...");
    fieldSelector.innerHTML = '<option>Consultando API...</option>';
    
    BX24.callMethod('crm.deal.userfield.list', {}, function(result) {
        if (result.error()) {
            logToScreen("ERRO API: " + result.error());
            fieldSelector.innerHTML = '<option>Erro na consulta</option>';
            return;
        }

        const fields = result.data();
        logToScreen(`Campos retornados: ${fields.length}`);
        
        let optionsHtml = '<option value="">-- Selecione o campo --</option>';
        let count = 0;

        fields.forEach(field => {
            // Lógica baseada no seu App CNPJ: Tenta pegar o Rótulo de várias formas
            // O Bitrix retorna EDIT_FORM_LABEL ou LIST_COLUMN_LABEL, as vezes como objeto, as vezes string.
            
            let rawLabel = field.EDIT_FORM_LABEL || field.LIST_COLUMN_LABEL || field.FIELD_NAME;
            let label = field.FIELD_NAME; // Fallback padrão

            if (rawLabel) {
                if (typeof rawLabel === 'object') {
                    // Tenta pegar PT, BR, ou o primeiro valor disponível no objeto
                    label = rawLabel.pt || rawLabel.br || rawLabel['pt-br'] || Object.values(rawLabel)[0];
                } else {
                    // Se for string direta
                    label = rawLabel;
                }
            }

            // Verifica tipos: File, Disk File ou String
            const isFile = (field.USER_TYPE_ID === 'file' || field.USER_TYPE_ID === 'disk_file' || field.USER_TYPE_ID === 'file_man');
            const isString = (field.USER_TYPE_ID === 'string'); 
            
            // Lista arquivos E strings (para garantir que a lista não fique vazia se não houver campo file)
            if (isFile || isString || forceRaw) {
                let icone = isFile ? '📁' : '📝';
                optionsHtml += `<option value="${field.FIELD_NAME}">${icone} ${label} (${field.USER_TYPE_ID})</option>`;
                count++;
            }
        });

        if (count === 0) {
            optionsHtml = '<option value="">Nenhum campo compatível encontrado!</option>';
            logToScreen("Atenção: A API retornou campos, mas nenhum tipo 'file' ou 'string' compatível.");
        } else {
            logToScreen(`${count} campos carregados na lista.`);
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
    // Estrutura para salvar arquivo no Bitrix
    fields[targetFieldCode] = { "fileData": ["assinatura.png", content] };

    BX24.callMethod('crm.deal.update', { id: currentDealId, fields: fields }, function(res) {
        btnSave.innerText = "SALVAR";
        if (res.error()) { 
            logToScreen("Erro update: " + res.error()); 
            showMessage("Erro ao salvar: Verifique se o campo selecionado aceita arquivos.", "error"); 
        }
        else { 
            showMessage("✅ Assinatura salva!", "success"); 
            ctx.clearRect(0,0,340,250); 
            hasSignature = false; 
        }
    });
});
