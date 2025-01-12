import minimist from "minimist";

const argv: minimist.ParsedArgs = require('minimist')(process.argv.slice(2));

class Log {
    private readonly isDebug: boolean = false
    constructor(argv: any) {
        if (argv.debug) {
            this.isDebug = true
        }
        console.log("Initialized logger, debug: ", this.isDebug)
    }

    debug(...data: any[]): void {
        if (this.isDebug) {
            console.log("[DBG]", ...data)
        }
    }

    info(...data: any[]): void {
        console.log("[INFO]", ...data)
    }
}

const log = new Log(argv)

export {argv, log}