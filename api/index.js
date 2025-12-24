const app = require('express')();
const bodyParser = require('body-parser');

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// --- HTML DA INTERFACE (Embutido para garantir o carregamento via POST) ---
const htmlInterface = `
<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Assinatura O.S.</title>
    <script src="//api.bitrix24.com/api/v1/"></script>
    <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #f0f2f5; margin: 0; padding: 10px; height: 100vh; box-sizing: border-box; overflow: hidden; }
        h3 { color: #535c69; margin-bottom: 15px; }
        canvas { background-color: #fff; border: 2px solid #c6cdd3; border-radius: 4px; cursor: crosshair; box-shadow: 0 2px 4px rgba(0,0,0,0.1); touch-action: none; }
        .buttons { margin-top: 20px; display: flex; gap: 10px; width: 100%; max-width: 350px; }
        button { flex: 1; padding: 15px; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; font-weight: bold; text-transform: uppercase; }
        .btn-limpar { background-color: #fff; border: 1px solid #c6cdd3; color: #535c69; }
        .btn-salvar { background-color: #3bc8f5; color: #fff; }
    </style>
</head>
<body>
    <h3>Assine abaixo:</h3>
    <canvas id="signature-pad" width="340" height="250"></canvas>
    <div class="buttons">
        <button class="btn-limpar" id="btn-clear">Limpar</button>
        <button class="btn-salvar" id="btn-save">Salvar</button>
    </div>
    <script src="script.js"></script>
</body>
</html>
`;

// Rota Principal (Aceita tanto GET quanto POST para abrir o app)
app.all('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlInterface);
});

// Rota padrão API (Health Check)
app.get('/api', (req, res) => res.json({ message: 'API Online.' }));

// Rota para Validação e Instalação
app.all('/install', (req, res) => {
    // Se for POST, executa a lógica de instalação
    if (req.method === 'POST') {
        const appUrl = 'https://app-assinatura-os.vercel.app'; 
        res.setHeader('Content-Type', 'text/html');
        res.send(`
            <!DOCTYPE html>
            <html>
            <head><script src="//api.bitrix24.com/api/v1/"></script></head>
            <body>
                <script>
                    BX24.init(function(){
                        BX24.callMethod('placement.bind', {
                            'PLACEMENT': 'TASK_VIEW_TAB',
                            'HANDLER': '${appUrl}',
                            'TITLE': 'Assinatura OS'
                        }, function(){ BX24.installFinish(); });
                    });
                </script>
            </body>
            </html>
        `);
    } else {
        // Se for GET (Validador do Bitrix), só diz OK
        res.send('Instalador pronto.');
    }
});

// Rota de Salvar
app.post('/api/save-signature', (req, res) => {
    try {
        const { imageBase64, taskId, auth } = req.body;
        console.log("Recebi assinatura para a tarefa:", taskId);
        // Aqui entraremos com a lógica final de anexar
        res.json({ success: true, message: 'Recebido' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno' });
    }
});

module.exports = app;
