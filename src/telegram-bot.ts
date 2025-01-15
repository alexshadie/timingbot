import {Note} from "./models/note";

require('module-alias/register')
import {Telegraf} from "telegraf";
import {User, Chat} from "@telegraf/types/manage"
import {argv, log} from "./app";
import {AppDataSource} from "./data-source";
import {dateFormatter} from "./format";
require('dotenv').config()

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || "")

const channels = (process.env.USERS || "").split(",").map((n: string) => parseInt(n))

const getChatCaption = (chat: Chat): string => {
    let chatTitle

    if (chat.type === 'private') {
        // Use username or first name for private chats
        chatTitle = chat.username ? `@${chat.username}` : chat.first_name || 'Unknown';
    } else {
        // Use title for group, supergroup, or channel chats
        chatTitle = chat.title || 'Unnamed Chat';
    }
    return `chat#${chat.id} (${chatTitle})`;
}

const getFromTitle = (from: User): string => {
    return from.username ? `@${from.username}` : from.first_name || 'Unknown';
}

const sendMessage = async (user: number, message: string): Promise<void> => {
    await bot.telegram.sendMessage(user, message)
}

const setupBot = () => {
    const checkSender = (ctx: any) => {return channels.includes(ctx.message?.chat.id)}

    bot.command("start", async (ctx) => {
        if (argv.trackstart) {
            log.debug(ctx.message.from)
        }
        if (!checkSender(ctx)) return
        await ctx.telegram.sendMessage(ctx.message.chat.id, `Started`)
    })

    bot.command("notes", async (ctx) => {
        const noteRepository = AppDataSource.getRepository(Note);
        const userId = ctx.message.from.id
        // Fetch all notes for the specified user_id
        const notes = await noteRepository.find({
            where: { user: userId },
            order: {ts: "asc"}
        });
        const text = notes.map((note) => {
            const date = dateFormatter.format(new Date(note.ts))
            return `${date} ${note.text}`;
        })
        await ctx.telegram.sendMessage(ctx.message.chat.id, text.join("\n"))
        log.debug(`Notes for user ${userId}:`, notes);
    })

    bot.on("message", async (ctx) => {
        log.debug("Hello")
        if (!checkSender(ctx)) return
        log.debug(ctx.message.from)
        log.debug(ctx.message)
        if ("text" in ctx.message) {
            log.debug(getFromTitle(ctx.message.from))
            if (ctx.message.from.id != ctx.message.chat.id) {
                log.debug(getChatCaption(ctx.message.chat))
            }
            log.debug(ctx.message.text)
            const note = new Note()
            note.user = ctx.message.from.id
            note.text = ctx.message.text
            note.ts = (new Date()).toUTCString()
            const entityManager = AppDataSource.manager;
            await entityManager.save(note);
            await ctx.telegram.setMessageReaction(ctx.message.chat.id, ctx.message.message_id, [{type: "emoji", emoji: "👌"}])
            log.debug('Note saved:', note);
        }
    })
}

export {sendMessage, bot, setupBot, channels}


