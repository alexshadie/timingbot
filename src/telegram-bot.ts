require('module-alias/register')
import {Telegraf} from "telegraf";
import type {User, Chat} from "@telegraf/types/manage"
import {Scheduler, Task} from "./scheduler"
import {argv, log} from "./lib";
import * as fs from 'fs';
require('dotenv').config()

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || "")

const channels = (process.env.USERS || "").split(",").map((n: string) => parseInt(n))
// Currently hardcoded to two users only
const at = channels[0]
const as = channels[1]

const getChatCaption = (chat: Chat): string => {
    let chatTitle = ""

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

function parseTaskLine(line: string): { user: string; time: string; message: string } | null {
    const match = line.match(/^(\w+)\s+(\d{2}:\d{2})\s+(.+)$/);
    if (!match) return null; // Invalid line format
    const [, user, time, src_message] = match;
    const message = `Сейчас ${time}` + "\n" + src_message.split("\\n").join("\n")
    log.debug(user, time, src_message)
    return { user, time, message };
}

// Read and parse the tasks file
function loadTasksFromFile(filePath: string, scheduler: Scheduler): void {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n').filter((line) => line.trim() !== ''); // Ignore empty lines

    for (const line of lines) {
        if (line == "") {
            continue
        }
        const task = parseTaskLine(line);
        log.debug(task)
        if (task) {
            const { user, time, message } = task;
            scheduler.addTask(time, () => sendMessage(user == 'as' ? as : at, message));
        } else {
            console.warn(`Invalid task format: ${line}`);
        }
    }
}

const initScheduler = (): Scheduler => {
    const s = new Scheduler()

    loadTasksFromFile("tasks.list", s)

    return s
}

const main = async () => {
    if (argv.msg) {
        await bot.telegram.sendMessage(at, argv.msg)
        return
    }

    const scheduler = initScheduler()
    scheduler.start();

    const checkSender = (ctx: any) => {return channels.includes(ctx.message?.chat.id)}
    bot.command("start", async (ctx) => {
        if (argv.trackstart) {
            console.log(ctx.message.from)
        }
        if (!checkSender(ctx)) return
        await ctx.telegram.sendMessage(ctx.message.chat.id, `Started`)
    })

    bot.on("message", async (ctx) => {
        log.debug("Hello")
        if (!checkSender(ctx)) return
        log.debug(ctx.message.from)
        log.debug(ctx.message)
        if ("text" in ctx.message) {
            console.log(getFromTitle(ctx.message.from))
            if (ctx.message.from.id != ctx.message.chat.id) {
                console.log(getChatCaption(ctx.message.chat))
            }
            console.log(ctx.message.text)
        }
        // await ctx.telegram.sendMessage(ctx.message.chat.id, `I'm here`)
    })

    log.info("Launching bot")

    bot.launch()

    // Enable graceful stop
    process.once('SIGINT', () => {bot.stop('SIGINT'); scheduler.stop()})
    process.once('SIGTERM', () => {bot.stop('SIGTERM'); scheduler.stop()})
}

main()

