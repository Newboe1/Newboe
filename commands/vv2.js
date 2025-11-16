const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const viewonceCommand = {
  pattern: "vv2",
  alias: ["wah", "ohh", "oho", "🙂", "😂", "❤️", "💋", "🥵", "🌚", "😒", "nice", "ok"],
  desc: "Owner Only - retrieve quoted message back to user",
  category: "owner",
  filename: __filename
};

async function handleViewOnce(sock, message, match, { from, isCreator }) {
  try {
    if (!isCreator) {
      return; // Simply return without any response if not owner
    }

    if (!message.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
      return await sock.sendMessage(from, {
        text: "*🍁 Please reply to a view once message!*"
      }, { quoted: message });
    }

    const quoted = message.message.extendedTextMessage.contextInfo.quotedMessage;
    const quotedImage = quoted.imageMessage;
    const quotedVideo = quoted.videoMessage;
    const quotedAudio = quoted.audioMessage;

    let buffer;
    let mimeType;
    let caption = '';

    if (quotedImage && quotedImage.viewOnce) {
      const stream = await downloadContentFromMessage(quotedImage, 'image');
      buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
      mimeType = quotedImage.mimetype || "image/jpeg";
      caption = quotedImage.caption || '';
    } else if (quotedVideo && quotedVideo.viewOnce) {
      const stream = await downloadContentFromMessage(quotedVideo, 'video');
      buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
      mimeType = quotedVideo.mimetype || "video/mp4";
      caption = quotedVideo.caption || '';
    } else if (quotedAudio) {
      const stream = await downloadContentFromMessage(quotedAudio, 'audio');
      buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
      mimeType = quotedAudio.mimetype || "audio/mp4";
    } else {
      return await sock.sendMessage(from, {
        text: "❌ Only image, video, and audio messages are supported"
      }, { quoted: message });
    }

    const options = { quoted: message };
    let messageContent = {};

    if (quotedImage && quotedImage.viewOnce) {
      messageContent = {
        image: buffer,
        caption: caption,
        mimetype: mimeType
      };
    } else if (quotedVideo && quotedVideo.viewOnce) {
      messageContent = {
        video: buffer,
        caption: caption,
        mimetype: mimeType
      };
    } else if (quotedAudio) {
      messageContent = {
        audio: buffer,
        mimetype: mimeType,
        ptt: quotedAudio.ptt || false
      };
    }

    // Forward to user's DM
    await sock.sendMessage(message.key.participant || message.key.remoteJid, messageContent, options);
    
  } catch (error) {
    console.error("vv Error:", error);
    await sock.sendMessage(from, {
      text: "❌ Error fetching vv message:\n" + error.message
    }, { quoted: message });
  }
}

module.exports = {
  command: viewonceCommand,
  handler: handleViewOnce
};
