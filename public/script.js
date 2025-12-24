const canvas = document.getElementById('signature-pad');
const ctx = canvas.getContext('2d');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');
const msgBox = document.getElementById('msg-box');
const debugLog = document.getElementById('debug-log');

// Configuração (Elementos Visuais)
const configPanel = document.getElementById('config-panel');
const btnSettings = document.getElementById('btn-settings');
const statusTask = document.getElementById('status-task');

// Variáveis de Estado
let isDrawing = false;
let hasSignature = false;
let currentTaskId = null;
let currentDealId = null;

// Variáveis de Mapeamento
let mapSignature = null;

// --- FERRAMENTA DE LOG ---
function logToScreen(msg) {
    console.log(msg);
}

// --- INICIALIZAÇÃO ---
if (typeof BX24 !== 'undefined') {
    logToScreen("Iniciando BX24...");
    BX24.init(function() {
        
        // Limpeza visual: esconde barra de status antiga e logs
        if(statusTask && statusTask.parentElement) statusTask.parentElement.style.display = 'none';
        if(debugLog) debugLog.style.display = 'none';

        const placement = BX24.placement.info();
        
        if (placement.options && placement.options.ID && placement.placement === 'CRM_DEAL_DETAIL_TAB') {
            currentDealId = placement.options.ID;
        } else if (placement.options && placement.options.taskId) {
            currentTaskId = placement.options.taskId;
        }
        
        // Se estiver na tarefa, busca o Negócio pai
        if (currentTaskId && !currentDealId) {
            findDealFromTask();
        }

        loadAppConfiguration();
    });
} else {
    console.error("ERRO FATAL: BX24 não encontrado.");
}

function findDealFromTask() {
    BX24.callMethod('tasks.task.get', { taskId: currentTaskId, select: ['UF_CRM_TASK'] }, function(res) {
        if (!res.error()) {
            const crmFields = res.data().task.ufCrmTask;
            if (crmFields && crmFields.length > 0) {
                const dealStr = crmFields.find(item => item.startsWith('D_'));
                if (dealStr) currentDealId = dealStr.replace('D_', '');
            }
        }
    });
}

function loadAppConfiguration() {
    // Usando v3 para garantir uma configuração limpa sem resquícios de comentários
    BX24.callMethod('app.option.get', { option: 'arseg_os_config_v3' }, function(result) {
        if(result.data()) {
            const config = result.data();
            mapSignature = config.signature;
        } else {
            openConfigPanel();
        }
    });
}

// --- PAINEL DE CONFIGURAÇÃO SIMPLIFICADO ---
function openConfigPanel() {
    configPanel.innerHTML = `
        <div style="background:white; padding:20px; border-radius:8px; width:90%; max-width:400px; text-align:left;">
            <h3 style="margin-top:0; color:#333;">⚙️ Configuração O.S.</h3>
            
            <label style="font-size:11px; font-weight:bold">🖊️ Onde salvar a Assinatura (Campo Arquivo)</label>
            <select id="sel-sig" style="width:100%; padding:8px; margin-bottom:20px; border:1px solid #ccc; border-radius:4px;"><option>Carregando...</option></select>

            <div style="display:flex; gap:10px;">
                <button id="btn-save-cfg" style="flex:1; padding:10px; background:#2fc6f6; color:white; border:none; border-radius:4px; font-weight:bold; cursor:pointer;">SALVAR</button>
                <button id="btn-cancel-cfg" style="flex:1; padding:10px; background:#ddd; color:#333; border:none; border-radius:4px; cursor:pointer;">CANCELAR</button>
            </div>
        </div>
    `;
    configPanel.style.display = 'flex';
    configPanel.style.flexDirection = 'column';
    configPanel.style.justifyContent = 'center';
    configPanel.style.alignItems = 'center';

    document.getElementById('btn-save-cfg').onclick = saveNewConfig;
    document.getElementById('btn-cancel-cfg').onclick = () => configPanel.style.display = 'none';

    loadDealFieldsForMapping();
}

function loadDealFieldsForMapping() {
    BX24.callMethod('crm.deal.fields', {}, function(result) {
        if (result.error()) return console.error(result.error());
        const fields = result.data();
        let optsFile = '<option value="">-- Selecione o campo --</option>';

        for (let key in fields) {
            if (!key.startsWith('UF_')) continue;
            let f = fields[key];
            let label = f.formLabel || f.listLabel || f.title || key;
            
            // Só lista campos de ARQUIVO
            if (f.type === 'file' || f.type === 'disk_file') {
                optsFile += `<option value="${key}" ${key === mapSignature ? 'selected' : ''}>📁 ${label}</option>`;
            }
        }
        document.getElementById('sel-sig').innerHTML = optsFile;
    });
}

function saveNewConfig() {
    const newConfig = {
        signature: document.getElementById('sel-sig').value
    };
    if (!newConfig.signature) return alert("Assinatura é obrigatória!");

    BX24.callMethod('app.option.set', { options: { 'arseg_os_config_v3': newConfig } }, function(res) {
        mapSignature = newConfig.signature;
        configPanel.style.display = 'none';
        showMessage("Configuração salva!", "success");
    });
}

// --- LÓGICA DO BOTÃO E CANVAS ---
btnSettings.addEventListener('click', openConfigPanel);

function showMessage(text, type) {
    msgBox.innerHTML = text;
    msgBox.className = type === 'error' ? 'msg-erro' : (type === 'success' ? 'msg-sucesso' : 'msg-info');
}

// Canvas
ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000000';
function getTouchPos(c, e) { var r = c.getBoundingClientRect(); return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top }; }
canvas.addEventListener('mousedown', (e) => { isDrawing = true; hasSignature = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); });
canvas.addEventListener('mousemove', (e) => { if (!isDrawing) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); });
canvas.addEventListener('mouseup', () => isDrawing = false); canvas.addEventListener('mouseout', () => isDrawing = false);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isDrawing = true; hasSignature = true; const pos = getTouchPos(canvas, e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (!isDrawing) return; const pos = getTouchPos(canvas, e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); }, { passive: false });
canvas.addEventListener('touchend', () => isDrawing = false);
btnClear.addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); hasSignature = false; });

// --- AÇÃO PRINCIPAL ---
btnSave.innerHTML = "SALVAR E CONCLUIR O.S.";

btnSave.addEventListener('click', () => {
    if (!hasSignature) { showMessage("Assinatura obrigatória.", "error"); return; }
    if (!mapSignature) { openConfigPanel(); return; }
    if (!currentDealId) { showMessage("Negócio não identificado.", "error"); return; }

    btnSave.innerText = "ENVIANDO...";
    btnSave.disabled = true;

    // Prepara a imagem
    const content = canvas.toDataURL('image/png').split(',')[1];
    
    let fields = {};
    fields[mapSignature] = { "fileData": ["assinatura_os.png", content] };
    
    // 1. Atualiza o Negócio com a assinatura
    BX24.callMethod('crm.deal.update', { id: currentDealId, fields: fields }, function(res) {
        if (res.error()) {
            console.error(res.error());
            showMessage("Erro ao salvar assinatura.", "error");
            btnSave.innerText = "ERRO";
            btnSave.disabled = false;
        } else {
            // 2. Se deu certo, conclui a tarefa
            concluirTarefa();
        }
    });
});

function concluirTarefa() {
    if(!currentTaskId) {
        showMessage("✅ Assinatura Salva! (Tarefa não vinculada)", "success");
        return;
    }

    btnSave.innerText = "CONCLUINDO TAREFA...";
    
    // Status 5 = Concluída
    BX24.callMethod('tasks.task.update', { taskId: currentTaskId, fields: { STATUS: 5 } }, function(res) {
        if(res.error()) {
            console.error(res.error());
            showMessage("⚠️ Assinatura salva, mas erro ao concluir tarefa.", "info");
        } else {
            showMessage("✅ O.S. FINALIZADA COM SUCESSO!", "success");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            hasSignature = false;
            btnSave.style.display = 'none'; // Some com o botão para evitar clique duplo
        }
    });
}
