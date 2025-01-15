import {AppDataSource} from "./data-source";
import run from "./telegram-bot";

AppDataSource.initialize().then(async () => {
    console.log('Data Source has been initialized!');
    run()
}).catch((err) => {
    console.error('Error during Data Source initialization:', err);
});
