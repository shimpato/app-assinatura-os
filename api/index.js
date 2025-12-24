const app = require('express')();

// Rota de teste para vermos se o servidor está rodando
app.get('/api', (req, res) => {
  res.json({ message: 'Backend do App de Assinatura está funcionando!' });
});

module.exports = app;
