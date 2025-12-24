const app = require('express')();
const bodyParser = require('body-parser');

// Aumenta limite para imagens e aceita dados de formulário (que o Bitrix envia ao instalar)
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Rota de teste
app.get('/api', (req, res) => {
  res.json({ message: 'API Online.' });
});

// --- ROTA DE INSTALAÇÃO (O Bitrix chama essa rota ao validar e instalar) ---
app.post('/install', (req, res) => {
    console.log("--- TENTATIVA DE INSTALAÇÃO ---");
    // O Bitrix envia tokens aqui no req.body
    
    // Respondemos com HTML para confirmar a instalação visualmente
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
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).json({ error: 'Sem imagem.' });

        console.log("Recebi assinatura. Tamanho:", imageBase64.length);
        
        // Aqui entraremos com a lógica de salvar no Bitrix depois
        res.json({ success: true, message: 'Assinatura recebida!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro interno.' });
    }
});

module.exports = app;
