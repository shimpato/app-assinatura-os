const app = require('express')();
const bodyParser = require('body-parser');
const axios = require('axios'); // Vamos usar isso para mandar comandos pro Bitrix

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Rota de teste
app.get('/api', (req, res) => {
  res.json({ message: 'API Online.' });
});

// Truque para o validador do Bitrix
app.get('/install', (req, res) => {
    res.send('Instalador pronto.');
});

// --- ROTA DE INSTALAÇÃO (Agora com Poderes de Criar Abas) ---
app.post('/install', async (req, res) => {
    console.log("--- TENTATIVA DE INSTALAÇÃO ---");
    
    const { auth } = req.body; // O Bitrix manda os tokens aqui

    if (auth && auth.access_token) {
        try {
            console.log("Autenticação recebida. Tentando registrar abas...");
            const domain = auth.domain;
            const token = auth.access_token;
            const appUrl = 'https://app-assinatura-os.vercel.app'; // Seu Link

            // 1. Forçar a aba na TAREFA
            await axios.post(`https://${domain}/rest/placement.bind`, {
                auth: token,
                PLACEMENT: 'TASK_VIEW_TAB',
                HANDLER: appUrl,
                TITLE: 'Assinatura OS',
                DESCRIPTION: 'Aba de assinatura digital'
            });

            // 2. Forçar a aba no NEGÓCIO (Deal)
            await axios.post(`https://${domain}/rest/placement.bind`, {
                auth: token,
                PLACEMENT: 'CRM_DEAL_DETAIL_TAB',
                HANDLER: appUrl,
                TITLE: 'Assinatura OS',
                DESCRIPTION: 'Aba de assinatura digital'
            });

            console.log("Abas registradas com sucesso!");

        } catch (error) {
            console.error("Erro ao registrar abas:", error.response ? error.response.data : error.message);
        }
    }

    // Resposta Visual
    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Instalando...</title>
            <script src="//api.bitrix24.com/api/v1/"></script>
            <style>body { font-family: sans-serif; text-align: center; padding: 40px; }</style>
        </head>
        <body>
            <h1 style="color: green;">Aplicativo Instalado e Abas Criadas!</h1>
            <p>Se as abas não aparecerem imediatamente, atualize a página da tarefa.</p>
            <script>
                BX24.init(function(){
                    BX24.installFinish();
                });
            </script>
        </body>
        </html>
    `);
});

// --- ROTA DE SALVAR ASSINATURA ---
app.post('/api/save-signature', (req, res) => {
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'Sem imagem.' });
        console.log("Recebi assinatura.");
        res.json({ success: true, message: 'Assinatura recebida!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno.' });
    }
});

module.exports = app;
