// main.js
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ]
});
const fs = require('fs');
const prefix = '/';
client.commands = new Map();

// Abone rolü, abone kanalı ve abone yetkilisi bilgilerini depolamak için değişkenler
let aboneRoleId = 'roleid'; // Buraya Abone Rolünün ID'sini Yazınız
let aboneChannelId = 'channelid'; // Buraya Abone Kanıt Fotoğraflarının Atılacağı Kanalın ID'sini Yazınız.
let adminRoleId = 'adminid'; // Buraya Abone Rol Verebilecek Yetkilinin ID'sini Yazınız

const commandFiles = fs.readdirSync('./komutlar').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./komutlar/${file}`);
    client.commands.set(command.name, command);
}

client.on('ready', () => {
    console.log(`Bot aktif!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('Komutu çalıştırırken bir hata oluştu.');
    }
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    // Abone olduğuna dair fotoğraf atıldığında
    if (message.attachments.size > 0) {
        await message.react('✅'); // Tik emoji
        await message.react('❌'); // X emoji
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    const member = reaction.message.guild.members.cache.get(user.id);

    // Sadece belirli bir kanalda yapılan tepkilere yanıt ver
    if (reaction.message.channel.id !== aboneChannelId) return;

    // Tepki emojisinin kontrolü
    if (reaction.emoji.name === '✅') {
        // Sadece abone yetkilisi olanlara işlem yapma
        if (member.roles.cache.has(adminRoleId)) {
            try {
                const aboneRole = reaction.message.guild.roles.cache.get(aboneRoleId);

                if (aboneRole && !member.roles.cache.has(aboneRoleId)) {
                    await member.roles.add(aboneRole);
                    reaction.message.reply(`${user.username}, abone rolü başarıyla verildi!`);
                }
            } catch (error) {
                console.error('Abone rolü verilirken bir hata oluştu:', error);
                reaction.message.reply('Abone rolü verilirken bir hata oluştu.');
            }
        } else {
            // Abone yetkilisi olmayanlara uyarı mesajı gönder
            reaction.message.reply('Bu işlemi gerçekleştirmek için gerekli yetkiye sahip değilsiniz.');
        }
    } else if (reaction.emoji.name === '❌') {
        // X emoji'ye basıldığında bir reddetme mesajı gönder
        reaction.message.reply(`${user.username}, abone başvurunuz reddedildi.`);
    }
});

client.login('BOT_TOKEN'); // Buraya Botunuzun Tokenini Giriniz