const app = require('express')();
const bodyParser = require('body-parser');

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Rota padrão
app.get('/api', (req, res) => res.json({ message: 'API Online.' }));

// Para passar na validação do Bitrix
app.get('/install', (req, res) => res.send('Instalador pronto.'));

// --- ROTA DE INSTALAÇÃO (COM DEPURAÇÃO VISUAL) ---
app.post('/install', (req, res) => {
    // URL do seu app (garanta que está igual ao cadastrado no painel)
    const appUrl = 'https://app-assinatura-os.vercel.app'; 

    res.setHeader('Content-Type', 'text/html');
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Instalando...</title>
            <script src="//api.bitrix24.com/api/v1/"></script>
            <style>body { font-family: sans-serif; text-align: center; padding: 20px; }</style>
        </head>
        <body>
            <h3>Configurando Abas...</h3>
            <p>Aguarde os alertas de confirmação.</p>
            
            <script>
                BX24.init(function(){
                    console.log('Iniciando registro de abas...');
                    
                    // 1. Tenta registrar a aba na TAREFA
                    BX24.callMethod(
                        'placement.bind',
                        {
                            'PLACEMENT': 'TASK_VIEW_TAB',
                            'HANDLER': '${appUrl}',
                            'TITLE': 'Assinatura OS',
                            'DESCRIPTION': 'Aba para assinatura digital'
                        },
                        function(result) {
                            if(result.error()) {
                                alert('ERRO ao criar aba na Tarefa: ' + result.error());
                                console.error(result.error());
                            } else {
                                console.log('Aba Tarefa OK');
                                
                                // 2. Se deu certo, tenta registrar no NEGÓCIO (Deal)
                                BX24.callMethod(
                                    'placement.bind',
                                    {
                                        'PLACEMENT': 'CRM_DEAL_DETAIL_TAB',
                                        'HANDLER': '${appUrl}',
                                        'TITLE': 'Assinatura OS'
                                    },
                                    function(res2) {
                                        if(res2.error()) {
                                            alert('ERRO ao criar aba no Negócio: ' + res2.error());
                                        } else {
                                            alert('SUCESSO! As abas foram criadas. O app será finalizado.');
                                            BX24.installFinish();
                                        }
                                    }
                                );
                            }
                        }
                    );
                });
            </script>
        </body>
        </html>
    `);
});

// Salvar Assinatura
app.post('/api/save-signature', (req, res) => {
    // ... Lógica futura ...
    res.json({ success: true });
});

module.exports = app;
