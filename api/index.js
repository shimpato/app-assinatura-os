const app = require('express')();
const bodyParser = require('body-parser');

// Aumentamos o limite para 10mb porque imagens em Base64 são grandes
app.use(bodyParser.json({ limit: '10mb' }));

// Rota de teste simples
app.get('/api', (req, res) => {
  res.json({ message: 'API Online e pronta.' });
});

// Rota PRINCIPAL: Recebe a assinatura
app.post('/api/save-signature', (req, res) => {
    try {
        const { imageBase64, placementInfo } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ error: 'Nenhuma imagem foi enviada.' });
        }

        // LOG para vermos no painel da Vercel se chegou
        console.log("Recebi uma assinatura!");
        console.log("Tamanho da imagem:", imageBase64.length);
        console.log("Dados do Bitrix:", placementInfo);

        // Por enquanto, apenas devolvemos um "OK" para o frontend
        // Na Fase 4, vamos adicionar aqui o código de enviar para o Bitrix
        res.json({ 
            success: true, 
            message: 'Assinatura recebida no servidor com sucesso!' 
        });

    } catch (error) {
        console.error("Erro no servidor:", error);
        res.status(500).json({ error: 'Erro interno ao processar assinatura.' });
    }
});

module.exports = app;
