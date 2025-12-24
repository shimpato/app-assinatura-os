const app = require('express')();
const bodyParser = require('body-parser');
const axios = require('axios');

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// --- HTML DA INTERFACE ---
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

// Rota Principal
app.all('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(htmlInterface);
});

// Rota Health Check
app.get('/api', (req, res) => res.json({ message: 'API Online.' }));

// Rota Instalação
app.all('/install', (req, res) => {
    if (req.method === 'POST') {
        const appUrl = 'https://app-assinatura-os.vercel.app'; 
        res.setHeader('Content-Type', 'text/html');
        res.send(`
            <!DOCTYPE html>
            <html><head><script src="//api.bitrix24.com/api/v1/"></script></head>
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
            </body></html>
        `);
    } else {
        res.send('Instalador pronto.');
    }
});

// --- ROTA DE SALVAR ASSINATURA (Onde a mágica acontece) ---
app.post('/api/save-signature', async (req, res) => {
    try {
        const { imageBase64, taskId, auth } = req.body;

        if (!imageBase64 || !taskId || !auth) {
            console.error("Dados incompletos:", { temImagem: !!imageBase64, taskId, temAuth: !!auth });
            return res.status(400).json({ error: 'Dados incompletos (Imagem, ID ou Auth faltando).' });
        }

        console.log(`Processando assinatura para Tarefa ID: ${taskId}`);

        // 1. Limpar o Base64 (remover o cabeçalho "data:image/png;base64,")
        const base64Content = imageBase64.split(',')[1];

        // 2. Enviar para o Bitrix (Criar comentário com arquivo)
        // Usamos o método task.comment.item.add
        const bitrixUrl = `https://${auth.domain}/rest/task.comment.item.add`;
        
        const payload = {
            auth: auth.access_token,
            TASKID: taskId,
            FIELDS: {
                POST_MESSAGE: "Assinatura do Cliente coletada via App.",
                // O truque para enviar arquivo direto via REST:
                FILES: [
                    { "NAME": "assinatura_cliente.png", "CONTENT": base64Content }
                ]
            }
        };

        const response = await axios.post(bitrixUrl, payload);

        if (response.data.error) {
            console.error("Erro do Bitrix:", response.data.error_description);
            throw new Error(response.data.error_description);
        }

        console.log("Comentário criado com sucesso! ID:", response.data.result);
        res.json({ success: true, commentId: response.data.result });

    } catch (error) {
        console.error("Erro ao salvar:", error.message);
        res.status(500).json({ error: 'Erro ao salvar no Bitrix: ' + error.message });
    }
});

module.exports = app;
