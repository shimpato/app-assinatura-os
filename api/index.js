const app = require('express')();
const bodyParser = require('body-parser');

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Rota de teste
app.get('/api', (req, res) => {
  res.json({ message: 'API Online.' });
});

// --- TRUQUE PARA PASSAR NA VALIDAÇÃO DO BITRIX ---
// O Bitrix testa o link com um GET antes de permitir salvar.
app.get('/install', (req, res) => {
    res.send('Instalador pronto.');
});

// --- ROTA DE INSTALAÇÃO REAL (POST) ---
app.post('/install', (req, res) => {
    console.log("--- TENTATIVA DE INSTALAÇÃO ---");
    
    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Instalação Concluída</title>
            <script src="//api.bitrix24.com/api/v1/"></script>
        </head>
        <body>
            <h1>Instalação realizada com sucesso!</h1>
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
