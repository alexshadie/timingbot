import {AppDataSource} from "./data-source";
import {bot, channels, sendMessage, setupBot} from "./telegram-bot";
import {log} from "./app";
import {Scheduler} from "./scheduler";
import fs from "fs";

var as: number, at: number

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
            log.warn(`Invalid task format: ${line}`);
        }
    }
}
const initScheduler = (): Scheduler => {
    const s = new Scheduler()

    loadTasksFromFile("tasks.list", s)

    return s
}

AppDataSource.initialize().then(async () => {
    log.debug('Data Source has been initialized!');

    log.debug('Setting up channel list')
    // Currently hardcoded to two users only
    at = channels[0]
    as = channels[1]

    log.info("Launching scheduler")
    const scheduler = initScheduler()
    scheduler.start();

    log.info("Launching bot")
    setupBot()
    bot.launch()

    // Enable graceful stop
    process.once('SIGINT', () => {bot.stop('SIGINT'); scheduler.stop()})
    process.once('SIGTERM', () => {bot.stop('SIGTERM'); scheduler.stop()})
}).catch((err) => {
    log.error('Error during Data Source initialization:', err);
});
