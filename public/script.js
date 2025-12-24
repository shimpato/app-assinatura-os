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
let mapComments = null; // Antigo mapSummary

// --- FERRAMENTA DE LOG (MODO SILENCIOSO) ---
function logToScreen(msg) {
    console.log(msg);
}

// --- INICIALIZAÇÃO ---
if (typeof BX24 !== 'undefined') {
    logToScreen("Iniciando BX24...");
    BX24.init(function() {
        
        // >>> LIMPEZA VISUAL <<<
        if(statusTask && statusTask.parentElement) statusTask.parentElement.style.display = 'none';
        if(debugLog) debugLog.style.display = 'none';

        const placement = BX24.placement.info();
        
        if (placement.options && placement.options.ID && placement.placement === 'CRM_DEAL_DETAIL_TAB') {
            currentDealId = placement.options.ID;
        } else if (placement.options && placement.options.taskId) {
            currentTaskId = placement.options.taskId;
        }
        
        // Se estiver na Tarefa, descobre o Deal
        if (currentTaskId && !currentDealId) {
            findDealFromTask();
        }

        // Carrega Configuração Salva
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
    BX24.callMethod('app.option.get', { option: 'arseg_os_config_v2' }, function(result) {
        if(result.data()) {
            const config = result.data();
            mapSignature = config.signature;
            mapComments = config.comments;
            logToScreen("Configurações carregadas.");
        } else {
            // Se não tem config, tenta abrir o painel
            openConfigPanel();
        }
    });
}

// --- CONSTRUTOR DO PAINEL DE CONFIGURAÇÃO ---
function openConfigPanel() {
    configPanel.innerHTML = `
        <div style="background:white; padding:20px; border-radius:8px; width:90%; max-width:400px; text-align:left;">
            <h3 style="margin-top:0; color:#333;">⚙️ Configurar Campos O.S.</h3>
            <p style="font-size:12px; color:#666; margin-bottom:15px">Mapeie onde salvar a Assinatura e os Comentários técnicos:</p>
            
            <label style="font-size:11px; font-weight:bold">🖊️ Campo de Assinatura (Arquivo)</label>
            <select id="sel-sig" style="width:100%; padding:8px; margin-bottom:10px; border:1px solid #ccc; border-radius:4px;"><option>Carregando...</option></select>

            <label style="font-size:11px; font-weight:bold">💬 Comentários do Técnico (Texto/HTML)</label>
            <select id="sel-com" style="width:100%; padding:8px; margin-bottom:20px; border:1px solid #ccc; border-radius:4px;"><option>Carregando...</option></select>

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
        
        let optsFile = '<option value="">-- Não salvar --</option>';
        let optsString = '<option value="">-- Não salvar --</option>';

        for (let key in fields) {
            if (!key.startsWith('UF_')) continue;

            let f = fields[key];
            let label = f.formLabel || f.listLabel || f.title || key;
            let type = f.type;

            if (type === 'file' || type === 'disk_file') {
                optsFile += `<option value="${key}" ${key === mapSignature ? 'selected' : ''}>📁 ${label}</option>`;
            } else if (type === 'string' || type === 'textarea') { // Aceita texto ou caixa de texto
                optsString += `<option value="${key}" ${key === mapComments ? 'selected' : ''}>📝 ${label}</option>`;
            }
        }

        document.getElementById('sel-sig').innerHTML = optsFile;
        document.getElementById('sel-com').innerHTML = optsString;
    });
}

function saveNewConfig() {
    const newConfig = {
        signature: document.getElementById('sel-sig').value,
        comments: document.getElementById('sel-com').value
    };

    if (!newConfig.signature) return alert("O campo de Assinatura é obrigatório!");

    // Usando chave v2 para não conflitar com a config antiga
    BX24.callMethod('app.option.set', { options: { 'arseg_os_config_v2': newConfig } }, function(res) {
        mapSignature = newConfig.signature;
        mapComments = newConfig.comments;
        configPanel.style.display = 'none';
        showMessage("Configuração salva!", "success");
    });
}

// --- LÓGICA PADRÃO ---
btnSettings.addEventListener('click', openConfigPanel);

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

// --- SALVAR TUDO ---
btnSave.addEventListener('click', () => {
    if (!hasSignature) { showMessage("Assine antes.", "error"); return; }
    if (!mapSignature) { openConfigPanel(); return; }
    if (!currentDealId) { showMessage("Negócio não identificado.", "error"); return; }

    btnSave.innerText = "LENDO COMENTÁRIOS...";

    // Se tiver Tarefa vinculada, busca os comentários
    if(currentTaskId) {
        // Método específico para ler comentários da tarefa
        BX24.callMethod('task.comment.item.getlist', { TASKID: currentTaskId }, function(res) {
            let commentsText = "";
            
            if(!res.error() && res.data()) {
                // Monta um texto único com todos os comentários
                res.data().forEach(comment => {
                    // Limpa tags HTML simples para ficar legível no campo de texto
                    let textClean = comment.POST_MESSAGE.replace(/<[^>]*>?/gm, '');
                    // Formato: [DATA] Autor: Mensagem
                    commentsText += `🗓️ ${new Date(comment.POST_DATE).toLocaleDateString()} - ${comment.AUTHOR_NAME}:\n${textClean}\n\n`;
                });
            } else {
                commentsText = "Nenhum comentário técnico encontrado na tarefa.";
            }

            enviarParaDeal(commentsText);
        });
    } else {
        enviarParaDeal("Tarefa não identificada.");
    }
});

function enviarParaDeal(finalComments) {
    btnSave.innerText = "ENVIANDO...";
    const content = canvas.toDataURL('image/png').split(',')[1];
    
    let fields = {};
    
    // 1. Campo Assinatura
    fields[mapSignature] = { "fileData": ["assinatura.png", content] };

    // 2. Campo Comentários (se estiver mapeado)
    if (mapComments) {
        fields[mapComments] = finalComments;
    }

    // Atualiza o Negócio
    BX24.callMethod('crm.deal.update', { id: currentDealId, fields: fields }, function(res) {
        btnSave.innerText = "SALVAR";
        if (res.error()) { 
            console.error("Erro update: " + res.error()); 
            showMessage("Erro ao salvar.", "error"); 
        }
        else { 
            showMessage("✅ Salvo com sucesso!", "success"); 
            ctx.clearRect(0,0,340,250); 
            hasSignature = false; 
        }
    });
}
