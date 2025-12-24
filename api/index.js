const app = require('express')();
const bodyParser = require('body-parser');

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

const htmlInterface = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assinatura O.S.</title>
    <script src="//api.bitrix24.com/api/v1/"></script>
    <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Open Sans', sans-serif; background-color: #f0f2f5; margin: 0; padding: 10px; height: 100vh; overflow-y: auto; position: relative; }
        
        /* Barra de Status (Diagnóstico) */
        .status-bar { background: #d9f2fa; color: #333; padding: 8px; font-size: 11px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #bce8f1; display: flex; justify-content: space-between; }
        
        .header { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 350px; margin: 0 auto 10px auto; }
        h3 { color: #535c69; margin: 0; font-size: 16px; }
        .settings-btn { background: none; border: none; cursor: pointer; color: #b0bdd3; transition: 0.3s; }
        .settings-btn:hover { color: #535c69; }

        .main-container { display: flex; flex-direction: column; align-items: center; }
        
        canvas { background-color: #fff; border: 2px solid #c6cdd3; border-radius: 4px; cursor: crosshair; touch-action: none; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

        .buttons { margin-top: 15px; display: flex; gap: 10px; width: 100%; max-width: 350px; }
        button { flex: 1; padding: 12px; border: none; border-radius: 4px; font-size: 14px; cursor: pointer; font-weight: bold; text-transform: uppercase; }
        .btn-limpar { background-color: #fff; border: 1px solid #c6cdd3; color: #535c69; }
        .btn-salvar { background-color: #3bc8f5; color: #fff; }
        
        /* Painel de Configuração */
        #config-panel { display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(240, 242, 245, 0.95); z-index: 10; flex-direction: column; align-items: center; justify-content: center; }
        .config-box { background: #fff; padding: 20px; border-radius: 8px; width: 90%; max-width: 300px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center; }
        select { width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #c6cdd3; border-radius: 4px; }
        .btn-config-save { background-color: #7bd500; color: #fff; width: 100%; }

        #msg-box { margin-top: 15px; font-size: 13px; text-align: center; font-weight: 600; min-height: 20px; color: #535c69; }
        .msg-erro { color: #ff5752; }
        .msg-sucesso { color: #7bd500; }

        /* Log visível na tela */
        #debug-log { margin-top: 20px; width: 100%; max-width: 350px; font-family: monospace; font-size: 10px; color: #666; background: #fff; padding: 10px; border: 1px solid #ccc; white-space: pre-wrap; display: none; }
    </style>
</head>
<body>

    <div class="status-bar" id="app-status">
        <span id="status-task">Tarefa: ...</span>
        <span id="status-deal">Negócio: ...</span>
    </div>

    <div id="config-panel">
        <div class="config-box">
            <h3>⚙️ Configuração Inicial</h3>
            <p style="font-size: 12px; color: #80868e; margin-top: 5px;">Selecione o campo do Negócio onde a assinatura será salva:</p>
            
            <select id="field-selector">
                <option value="">Carregando campos...</option>
            </select>

            <button class="btn-config-save" id="btn-save-config">Salvar Configuração</button>
            <button class="btn-limpar" style="margin-top: 10px; width:100%" id="btn-cancel-config">Voltar</button>
            
            <div style="margin-top:15px; font-size: 10px; color: blue; cursor: pointer; text-decoration: underline;" onclick="loadDealFields(true)">Recarregar Lista de Campos</div>
        </div>
    </div>

    <div class="header">
        <h3>Assinatura Digital</h3>
        <button class="settings-btn" id="btn-settings" title="Configurar">⚙️</button>
    </div>

    <div class="main-container">
        <canvas id="signature-pad" width="340" height="250"></canvas>
        <div class="buttons">
            <button class="btn-limpar" id="btn-clear">Limpar</button>
            <button class="btn-salvar" id="btn-save">Salvar</button>
        </div>
        <div id="msg-box"></div>
        <div id="debug-log"></div>
    </div>

    <script src="script.js"></script>
</body>
</html>
`;
// ... resto do arquivo mantém igual (rotas) ...
app.all('/', (req, res) => { res.setHeader('Content-Type', 'text/html'); res.send(htmlInterface); });
app.get('/api', (req, res) => res.json({ message: 'API Online.' }));
app.all('/install', (req, res) => {
    if (req.method === 'POST') {
        const appUrl = 'https://app-assinatura-os.vercel.app'; 
        res.setHeader('Content-Type', 'text/html');
        res.send(`<!DOCTYPE html><html><head><script src="//api.bitrix24.com/api/v1/"></script></head><body><script>BX24.init(function(){BX24.callMethod('placement.bind', {'PLACEMENT': 'TASK_VIEW_TAB','HANDLER': '${appUrl}','TITLE': 'Assinatura OS'}, function(){ BX24.installFinish(); });});</script></body></html>`);
    } else { res.send('Instalador pronto.'); }
});
app.post('/api/save-signature', (req, res) => res.json({ success: true }));

module.exports = app;
