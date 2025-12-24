const app = require('express')();
const bodyParser = require('body-parser');

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// --- HTML DA INTERFACE (Com área de mensagens) ---
const htmlInterface = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assinatura O.S.</title>
    <script src="//api.bitrix24.com/api/v1/"></script>
    <style>
        body { font-family: 'Open Sans', sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #f0f2f5; margin: 0; padding: 10px; height: 100vh; box-sizing: border-box; overflow: hidden; }
        h3 { color: #535c69; margin-bottom: 10px; font-size: 18px; }
        
        canvas { 
            background-color: #fff; 
            border: 2px solid #c6cdd3; 
            border-radius: 4px; 
            cursor: crosshair; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.05); 
            touch-action: none; 
        }

        .buttons { margin-top: 15px; display: flex; gap: 10px; width: 100%; max-width: 350px; }
        
        button { 
            flex: 1; 
            padding: 12px; 
            border: none; 
            border-radius: 4px; 
            font-size: 14px; 
            cursor: pointer; 
            font-weight: bold; 
            text-transform: uppercase; 
            transition: opacity 0.2s;
        }
        button:disabled { opacity: 0.6; cursor: not-allowed; }

        .btn-limpar { background-color: #fff; border: 1px solid #c6cdd3; color: #535c69; }
        .btn-salvar { background-color: #3bc8f5; color: #fff; }
        .btn-salvar:hover { background-color: #34b3db; }

        /* NOVA ÁREA DE MENSAGENS */
        #msg-box {
            margin-top: 15px;
            font-size: 14px;
            text-align: center;
            min-height: 20px;
            font-weight: 600;
            max-width: 340px;
            line-height: 1.4;
        }
        .msg-erro { color: #ff5752; }   /* Vermelho Bitrix */
        .msg-sucesso { color: #7bd500; } /* Verde Bitrix */
        .msg-info { color: #535c69; }    /* Cinza */
    </style>
</head>
<body>
    <h3>Assine abaixo:</h3>
    <canvas id="signature-pad" width="340" height="250"></canvas>
    
    <div class="buttons">
        <button class="btn-limpar" id="btn-clear">Limpar</button>
        <button class="btn-salvar" id="btn-save">Salvar Assinatura</button>
    </div>

    <div id="msg-box"></div>

    <script src="script.js"></script>
</body>
</html>
`;

// Rotas (Mantivemos a lógica que já funciona)
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
