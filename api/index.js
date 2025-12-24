const app = require('express')();
const bodyParser = require('body-parser');
const path = require('path');

// Aumenta limite para imagens e aceita dados de formulário (que o Bitrix envia ao instalar)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Rota de teste
app.get('/api', (req, res) => {
  res.json({ message: 'API Online.' });
});

// --- ROTA DE INSTALAÇÃO (O Bitrix chama essa rota ao instalar) ---
app.post('/install', (req, res) => {
    console.log("--- TENTATIVA DE INSTALAÇÃO ---");
    console.log("Dados recebidos do Bitrix:", req.body);

    // O Bitrix envia tokens de autenticação no corpo da requisição (req.body)
    // AUTH_ID, REFRESH_ID, DOMAIN, etc.
    
    // Respondemos com uma página HTML simples confirmando o sucesso
    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Instalação Concluída</title>
            <script src="//api.bitrix24.com/api/v1/"></script>
            <style>body { font-family: sans-serif; text-align: center; padding: 40px; }</style>
        </head>
        <body>
            <h1 style="color: green;">Instalação realizada com sucesso!</h1>
            <p>O aplicativo de Assinatura foi instalado no seu portal.</p>
            <p>Você já pode fechar esta janela.</p>
            <script>
                // Finaliza a instalação na interface do Bitrix
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
        const { imageBase64, placementInfo } = req.body;

        if (!imageBase64) return res.status(400).json({ error: 'Sem imagem.' });

        console.log("Recebi assinatura. Tamanho:", imageBase64.length);
        
        // AQUI futuramente vamos usar os tokens para salvar no Bitrix
        
        res.json({ success: true, message: 'Assinatura recebida!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

module.exports = app;
