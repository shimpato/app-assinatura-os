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
        body { font-family: 'Open Sans', sans-serif; background-color: #f0f2f5; margin: 0; padding: 10px; height: 100vh; overflow: hidden; position: relative; }
        
        /* Cabeçalho com Configurações */
        .header { display: flex; justify-content: space-between; align-items: center; width: 100%; max-width: 350px; margin: 0 auto 10px auto; }
        h3 { color: #535c69; margin: 0; font-size: 16px; }
        .settings-btn { background: none; border: none; cursor: pointer; color: #b0bdd3; transition: 0.3s; }
        .settings-btn:hover { color: #535c69; }

        /* Área Principal */
        .main-container { display: flex; flex-direction: column; align-items: center; }
        
        canvas { 
            background-color: #fff; border: 2px solid #c6cdd3; border-radius: 4px; 
            cursor: crosshair; touch-action: none; box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }

        .buttons { margin-top: 15px; display: flex; gap: 10px; width: 100%; max-width: 350px; }
        button { flex: 1; padding: 12px; border: none; border-radius: 4px; font-size: 14px; cursor: pointer; font-weight: bold; text-transform: uppercase; }
        .btn-limpar { background-color: #fff; border: 1px solid #c6cdd3; color: #535c69; }
        .btn-salvar { background-color: #3bc8f5; color: #fff; }
        
        /* Painel de Configuração (Escondido por padrão) */
        #config-panel {
            display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: #f0f2f5; z-index: 10; flex-direction: column; align-items: center; justify-content: center;
        }
        .config-box { background: #fff; padding: 20px; border-radius: 8px; width: 90%; max-width: 300px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center; }
        select { width: 100%; padding: 10px; margin: 15px 0; border: 1px solid #c6cdd3; border-radius: 4px; }
        .btn-config-save { background-color: #7bd500; color: #fff; width: 100%; }

        #msg-box { margin-top: 15px; font-size: 13px; text-align: center; font-weight: 600; min-height: 20px; color: #535c69; }
        .msg-erro { color: #ff5752; }
        .msg-sucesso { color: #7bd500; }
    </style>
</head>
<body>

    <div id="config-panel">
        <div class="config-box">
            <h3>⚙️ Configuração Inicial</h3>
            <p style="font-size: 13px; color: #80868e; margin-top: 5px;">Selecione o campo do Negócio onde a assinatura será salva:</p>
            
            <select id="field-selector">
                <option value="">Carregando campos...</option>
            </select>

            <button class="btn-config-save" id="btn-save-config">Salvar Configuração</button>
            <button class="btn-limpar" style="margin-top: 10px; width:100%" id="btn-cancel-config">Voltar</button>
        </div>
    </div>

    <div class="header">
        <h3>Assinatura Digital</h3>
        <button class="settings-btn" id="btn-settings" title="Configurar Campo">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/><path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/></svg>
        </button>
    </div>

    <div class="main-container">
        <canvas id="signature-pad" width="340" height="250"></canvas>
        <div class="buttons">
            <button class="btn-limpar" id="btn-clear">Limpar</button>
            <button class="btn-salvar" id="btn-save">Salvar Assinatura</button>
        </div>
        <div id="msg-box"></div>
    </div>

    <script src="script.js"></script>
</body>
</html>
`;

// Rotas
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
