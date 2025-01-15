import 'reflect-metadata';
import { DataSource } from 'typeorm';
import {Note} from "./models/note";
require('dotenv').config()

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    username: process.env.MYSQL_USER || 'user',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'timingbot',
    synchronize: true, // set false in prod
    logging: false,
    entities: [
        Note
    ],
    migrations: [],
    subscribers: [],
});

