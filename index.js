require('dotenv').config();
const tmi = require('tmi.js');
const mongoose = require('mongoose');
const http = require('http'); 

// 1. Ukryty mini-serwer dla UptimeRobot (podtrzymuje bota przy życiu 24/7)
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('OK');
}).listen(10000, () => console.log('✅ Serwer podtrzymujący bota działa na porcie 10000'));

// 2. Definicja modelu gracza z Twojej strony
const userSchema = new mongoose.Schema({
    username: String,
    points: { type: Number, default: 0 }
});
const User = mongoose.model('User', userSchema, 'users');

// 3. Połączenie z bazą danych MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Bot pomyślnie połączony z bazą MongoDB!'))
    .catch(err => console.error('❌ Błąd połączenia bazy:', err));

// 4. Konfiguracja połączenia z Twitchem
const client = new tmi.Client({
    options: { debug: true },
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: process.env.BOT_USERNAME,
        password: process.env.OAUTH_TOKEN
    },
    channels: [ process.env.CHANNEL_NAME ]
});

// 5. Połącz z Twitchem
client.connect().catch(console.error);

// Wycinka: automat spamujący usunięty - czat jest teraz czysty!

// 6. Nasłuchiwanie wiadomości na czacie (tylko pod komendy)
client.on('message', async (channel, tags, message, self) => {
    if (self) return;

    const msg = message.toLowerCase();
    const args = message.split(' ');

    if (msg === '!hej') {
        client.say(channel, `@${tags.username}, siemanko na streamie! RBX Rewards działa!`);
    }

    if (msg === '!strona' || msg === '!link') {
        client.say(channel, `Zarabiaj na kebsa i energola tutaj: https://rbx-rewards.onrender.com 💸`);
    }

    if (msg === '!robux' || msg === '!info') {
        client.say(channel, `Graj w gry, wypełniaj ankiety i wypłacaj kaskę prosto na PayPal! Wpisz !strona żeby zacząć.`);
    }

    if (msg.startsWith('!punkty')) {
        if (args.length < 2) {
            client.say(channel, `@${tags.username}, podaj nick gracza! Użycie: !punkty <TwójNickZRobloxa>`);
            return;
        }

        const targetUser = args[1];

        try {
            const player = await User.findOne({ username: new RegExp('^' + targetUser + '$', 'i') });

            if (player) {
                const safePoints = Math.floor(player.points * 100) / 100;
                client.say(channel, `💰 Gracz ${player.username} ma obecnie ${safePoints.toFixed(2)} R$ na koncie RBX Rewards!`);
            } else {
                client.say(channel, `❌ Nie znaleziono gracza "${targetUser}" w bazie RBX Rewards.`);
            }
        } catch (error) {
            console.error("Błąd odpytywania bazy:", error);
            client.say(channel, `@${tags.username}, wystąpił problem z połączeniem z bazą danych.`);
        }
    }
});