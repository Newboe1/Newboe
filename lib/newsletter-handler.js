const newsletterConfig = {
    autoFollowChannels: [
        "120363417542294659@newsletter",
        "120363401297349965@newsletter",
        "120363339980514201@newsletter", 
        "120363299029326322@newsletter",
        "120363420947784745@newsletter"
    ],
    reactionEmojis: ["😂", "🥺", "👍", "☺️", "🥹", "♥️", "🩵", "🔥", "⭐", "💯"],
    autoFollow: true,
    autoReact: true,
    autoStatusSeen: true
};

class NewsletterHandler {
    constructor(botInstance) {
        this.bot = botInstance;
        this.config = newsletterConfig;
        this.followedChannels = new Set();
    }

    async autoFollowChannels() {
        if (!this.config.autoFollow) return;

        console.log(`📰 Attempting to auto-follow ${this.config.autoFollowChannels.length} newsletter channels...`);

        let results = { followed: [], alreadyFollowing: [], failed: [] };

        for (const channelJid of this.config.autoFollowChannels) {
            try {
                const metadata = await this.bot.newsletterMetadata("jid", channelJid);
                
                if (!metadata.viewer_metadata) {
                    await this.bot.newsletterFollow(channelJid);
                    results.followed.push(channelJid);
                    this.followedChannels.add(channelJid);
                    console.log(`✅ Followed newsletter: ${channelJid}`);
                } else {
                    results.alreadyFollowing.push(channelJid);
                    this.followedChannels.add(channelJid);
                    console.log(`📌 Already following: ${channelJid}`);
                }
            } catch (error) {
                results.failed.push(channelJid);
                console.log(`❌ Failed to follow ${channelJid}: ${error.message}`);
            }
        }

        console.log(`📰 Newsletter Follow Summary:\n✅ New: ${results.followed.length}\n📌 Existing: ${results.alreadyFollowing.length}\n❌ Failed: ${results.failed.length}`);
        
        return results;
    }

    async handleNewsletterReaction(mek) {
        if (!this.config.autoReact) return;

        if (!mek.key || !this.config.autoFollowChannels.includes(mek.key.remoteJid)) {
            return;
        }

        try {
            const serverId = mek.newsletterServerId;
            if (!serverId) return;

            const randomEmoji = this.config.reactionEmojis[
                Math.floor(Math.random() * this.config.reactionEmojis.length)
            ];

            await this.bot.newsletterReactMessage(
                mek.key.remoteJid,
                serverId.toString(),
                randomEmoji
            );
            
            console.log(`✅ Reacted to newsletter ${mek.key.remoteJid} with ${randomEmoji}`);
        } catch (error) {
            console.log(`❌ Newsletter reaction failed: ${error.message}`);
        }
    }

    async handleNewsletterStatus(mek) {
        if (!this.config.autoStatusSeen) return;

        if (mek.key && this.config.autoFollowChannels.includes(mek.key.remoteJid)) {
            try {
                await this.bot.readMessages([mek.key]);
                console.log(`👀 Marked newsletter message as seen: ${mek.key.remoteJid}`);
            } catch (error) {
                console.log(`❌ Failed to mark newsletter as seen: ${error.message}`);
            }
        }
    }
}

module.exports = { NewsletterHandler, newsletterConfig };
