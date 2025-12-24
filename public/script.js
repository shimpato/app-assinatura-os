const canvas = document.getElementById('signature-pad');
const ctx = canvas.getContext('2d');
const btnClear = document.getElementById('btn-clear');
const btnSave = document.getElementById('btn-save');
const msgBox = document.getElementById('msg-box');

// Elementos de Configuração
const configPanel = document.getElementById('config-panel');
const fieldSelector = document.getElementById('field-selector');
const btnSaveConfig = document.getElementById('btn-save-config');
const btnCancelConfig = document.getElementById('btn-cancel-config');
const btnSettings = document.getElementById('btn-settings');

let isDrawing = false;
let hasSignature = false;
let currentTaskId = null;
let currentDealId = null;
let targetFieldCode = null; // O código do campo (Ex: UF_CRM_12345) será carregado aqui

// --- INICIALIZAÇÃO ---
if (typeof BX24 !== 'undefined') {
    BX24.init(function() {
        // 1. Identifica onde estamos (Tarefa ou Deal)
        const placement = BX24.placement.info();
        if (placement.options && placement.options.ID && placement.placement === 'CRM_DEAL_DETAIL_TAB') {
            currentDealId = placement.options.ID;
        } else if (placement.options && placement.options.taskId) {
            currentTaskId = placement.options.taskId;
        }

        // 2. Carrega a Configuração Salva (app.option)
        loadAppConfiguration();
    });
}

// --- FUNÇÕES DE CONFIGURAÇÃO ---

function loadAppConfiguration() {
    // Pede ao Bitrix a opção salva chamada 'signature_target_field'
    BX24.callMethod('app.option.get', { option: 'signature_target_field' }, function(result) {
        if(result.data()) {
            targetFieldCode = result.data();
            console.log("Campo configurado:", targetFieldCode);
        } else {
            console.log("Nenhum campo configurado. Abrindo configurações...");
            openConfigPanel(); // Se não tem config, obriga a configurar
        }
    });
}

function openConfigPanel() {
    configPanel.style.display = 'flex'; // Mostra o modal
    loadDealFields(); // Busca os campos no Bitrix
}

function closeConfigPanel() {
    configPanel.style.display = 'none';
}

function loadDealFields() {
    fieldSelector.innerHTML = '<option>Carregando campos...</option>';
    
    // Busca campos personalizados do Deal
    BX24.callMethod('crm.deal.userfield.list', {}, function(result) {
        if (result.error()) {
            alert('Erro ao listar campos: ' + result.error());
            return;
        }

        const fields = result.data();
        let optionsHtml = '<option value="">-- Selecione o Campo de Arquivo --</option>';
        let found = false;

        fields.forEach(field => {
            // Filtra apenas campos do tipo ARQUIVO ('file')
            if (field.USER_TYPE_ID === 'file') {
                const selected = field.FIELD_NAME === targetFieldCode ? 'selected' : '';
                // Mostra o Label (Nome legível) e usa o ID interno (UF_CRM_...) como valor
                let label = field.EDIT_FORM_LABEL.pt || field.EDIT_FORM_LABEL.en || field.FIELD_NAME;
                optionsHtml += `<option value="${field.FIELD_NAME}" ${selected}>${label} (${field.FIELD_NAME})</option>`;
                found = true;
            }
        });

        if (!found) {
            optionsHtml = '<option value="">Nenhum campo de arquivo encontrado no Negócio</option>';
        }

        fieldSelector.innerHTML = optionsHtml;
    });
}

// Salvar a escolha do usuário
btnSaveConfig.addEventListener('click', () => {
    const selected = fieldSelector.value;
    if (!selected) {
        alert("Por favor, selecione um campo.");
        return;
    }

    // Salva no banco de dados do app no Bitrix
    btnSaveConfig.innerText = "Salvando...";
    BX24.callMethod('app.option.set', { options: { 'signature_target_field': selected } }, function(res) {
        targetFieldCode = selected;
        btnSaveConfig.innerText = "Salvar Configuração";
        closeConfigPanel();
        showMessage("Configuração salva com sucesso!", "success");
    });
});

// Botões de abrir/fechar config
btnSettings.addEventListener('click', openConfigPanel);
btnCancelConfig.addEventListener('click', closeConfigPanel);


// --- LÓGICA DE DESENHO E ENVIO (PADRÃO) ---

function showMessage(text, type) {
    msgBox.innerHTML = text;
    msgBox.className = '';
    if (type === 'error') msgBox.classList.add('msg-erro');
    else if (type === 'success') msgBox.classList.add('msg-sucesso');
    else msgBox.classList.add('msg-info');
}

ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000000';
function getTouchPos(canvasDom, touchEvent) { var rect = canvasDom.getBoundingClientRect(); return { x: touchEvent.touches[0].clientX - rect.left, y: touchEvent.touches[0].clientY - rect.top }; }
canvas.addEventListener('mousedown', (e) => { isDrawing = true; hasSignature = true; ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY); showMessage("", "info"); });
canvas.addEventListener('mousemove', (e) => { if (!isDrawing) return; ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); });
canvas.addEventListener('mouseup', () => isDrawing = false); canvas.addEventListener('mouseout', () => isDrawing = false);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); isDrawing = true; hasSignature = true; const pos = getTouchPos(canvas, e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y); showMessage("", "info"); }, { passive: false });
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); if (!isDrawing) return; const pos = getTouchPos(canvas, e); ctx.lineTo(pos.x, pos.y); ctx.stroke(); }, { passive: false });
canvas.addEventListener('touchend', () => isDrawing = false);

btnClear.addEventListener('click', () => { ctx.clearRect(0, 0, canvas.width, canvas.height); hasSignature = false; showMessage("", "info"); });

// --- BOTÃO SALVAR ASSINATURA ---
btnSave.addEventListener('click', () => {
    if (!hasSignature) { showMessage("Por favor, assine antes de salvar.", "error"); return; }
    
    // Verificação crucial
    if (!targetFieldCode) { 
        showMessage("⚠️ App não configurado. Clique na engrenagem acima.", "error"); 
        openConfigPanel();
        return; 
    }

    btnSave.disabled = true;
    btnSave.innerText = "PROCESSANDO...";
    
    // Lógica para achar o Deal através da Tarefa
    if (currentTaskId && !currentDealId) {
        showMessage("Buscando Negócio vinculado...", "info");
        BX24.callMethod('tasks.task.get', { taskId: currentTaskId, select: ['UF_CRM_TASK'] }, function(res) {
            if (res.error()) { handleError("Erro ao ler tarefa: " + res.error()); return; }
            const crmFields = res.data().task.ufCrmTask;
            if (crmFields && crmFields.length > 0) {
                const dealStr = crmFields.find(item => item.startsWith('D_'));
                if (dealStr) {
                    currentDealId = dealStr.replace('D_', '');
                    saveToDeal();
                } else { handleError("Esta tarefa não está vinculada a nenhum Negócio."); }
            } else { handleError("Nenhum vínculo CRM encontrado."); }
        });
    } else if (currentDealId) {
        saveToDeal();
    } else {
        handleError("Contexto não identificado (Abra via Tarefa ou Negócio).");
    }
});

function saveToDeal() {
    showMessage(`Salvando no Negócio #${currentDealId}...`, "info");
    const imageBase64 = canvas.toDataURL('image/png');
    const content = imageBase64.split(',')[1];
    
    let fieldsToUpdate = {};
    // USA O CAMPO CONFIGURADO DINAMICAMENTE
    fieldsToUpdate[targetFieldCode] = { "fileData": ["assinatura_os.png", content] };

    BX24.callMethod('crm.deal.update', { id: currentDealId, fields: fieldsToUpdate }, function(result) {
        btnSave.disabled = false;
        btnSave.innerText = "SALVAR ASSINATURA";
        if (result.error()) {
            handleError("Erro ao salvar: " + result.error().ex.error_description);
        } else {
            showMessage("✅ Sucesso! Assinatura salva no campo configurado.", "success");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            hasSignature = false;
        }
    });
}

function handleError(msg) {
    console.error(msg); showMessage(msg, "error"); btnSave.disabled = false; btnSave.innerText = "SALVAR ASSINATURA";
}
