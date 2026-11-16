const { WebcastPushConnection } = require('tiktok-live-connector');
const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

console.log(`Servidor WebSocket rodando na porta ${PORT}`);

wss.on('connection', (ws) => {
    console.log('Cliente conectado ao jogo!');
    let tiktokConnection = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.action === 'join' && data.uniqueId) {
                const username = data.uniqueId.replace('@', '');
                console.log(`Conectando à live do TikTok: @${username}`);

                if (tiktokConnection) {
                    try { tiktokConnection.disconnect(); } catch (e) {}
                }

                tiktokConnection = new WebcastPushConnection(username);

                tiktokConnection.connect().then(() => {
                    console.log(`Conectado com sucesso na live de @${username}`);
                }).catch(err => {
                    console.error("Erro ao conectar no TikTok:", err);
                });

                tiktokConnection.on('chat', (res) => {
                    ws.send(JSON.stringify({
                        type: 'chat',
                        user: res.uniqueId,
                        avatar: res.profilePictureUrl,
                        comment: res.comment
                    }));
                });

                tiktokConnection.on('like', (res) => {
                    ws.send(JSON.stringify({
                        type: 'like',
                        user: res.uniqueId,
                        avatar: res.profilePictureUrl,
                        count: res.likeCount
                    }));
                });

                tiktokConnection.on('gift', (res) => {
                    ws.send(JSON.stringify({
                        type: 'gift',
                        user: res.uniqueId,
                        avatar: res.profilePictureUrl,
                        giftName: res.giftName,
                        diamondCount: res.diamondCount,
                        repeatCount: res.repeatCount || 1
                    }));
                });

                tiktokConnection.on('follow', (res) => {
                    ws.send(JSON.stringify({
                        type: 'follow',
                        user: res.uniqueId,
                        avatar: res.profilePictureUrl
                    }));
                });
            }
        } catch (e) {}
    });

    ws.on('close', () => {
        if (tiktokConnection) {
            try { tiktokConnection.disconnect(); } catch (e) {}
        }
    });
});
