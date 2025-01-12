import {log} from "./lib";

type Task = {
    time: string; // Format: "HH:mm", e.g., "14:30"
    callback: () => void;
};

class Scheduler {
    private tasks: Task[] = [];
    private intervalId: NodeJS.Timeout | null = null;
    private lastCheckedTime: string = "00:00";

    constructor() {
        this.lastCheckedTime = (new Date()).toTimeString().slice(0, 5) // Save current minute and do not track it
    }

    // Add a new task to the scheduler
    addTask(time: string, callback: () => Promise<void> | void): void {
        this.tasks.push({ time, callback });
    }

    // Start the scheduler
    start(): void {
        if (this.intervalId) return; // Avoid duplicate intervals
        this.intervalId = setInterval(() => this.checkTasks(), 5 * 1000); // Check every 5 seconds
        log.info("CronScheduler started!");
    }

    // Stop the scheduler
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            log.info("CronScheduler stopped!");
        }
    }

    // Check tasks and invoke callbacks if time matches
    private async checkTasks(): Promise<void> {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // Format: "HH:mm"
        if (currentTime == this.lastCheckedTime) {
            log.debug("Check early")
            return
        }
        log.debug(`Running ${currentTime}`)
        this.lastCheckedTime = currentTime

        for (const task of this.tasks) {
            if (task.time === currentTime) {
                try {
                    log.info(`Executing task scheduled for ${task.time}`);
                    await task.callback(); // Await the async callback
                } catch (error) {
                    console.error(`Error executing task at ${task.time}:`, error);
                }
            }
        }
    }
}

export {Scheduler, Task}