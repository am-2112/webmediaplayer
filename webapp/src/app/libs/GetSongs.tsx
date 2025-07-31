'use server'

import mysql from 'mysql2/promise'
//import {promises as fs} from 'fs'
import fs from 'fs'
import { createReadableStreamFromReadable } from '@react-router/node'
import Stream from 'stream'
export default async function GetSongs(query, offset) {
    /** need to access database and query (and order first x item filenames) - ajax to load sound files (will want to store details in env and gitignore the file) */
    try {
        const connection = await mysql.createConnection({
            host: "localhost",
            port: 3306,
            user: "dev",
            password: "password",
            database: "soundtracks"
        })

        console.log("successful connection");

        /** the default 4 character limit for matching words will be a problem (eg. ME won't match to ME & CREED...) */
        const search_query = `
        SELECT *, MATCH (title, artists)
        AGAINST ("*` + query + `*" IN BOOLEAN MODE) AS relevance
        FROM soundtracks.songs
        WHERE MATCH (title, artists)
        AGAINST ("*` + query + `*" IN BOOLEAN MODE)
        ORDER BY relevance DESC, soundtracks.songs.upload_date DESC
        LIMIT 20 OFFSET ` + offset;

        const [results] = await connection.execute(search_query);
        console.log("results: ");
        console.log(results);

        /** may want to send a compressed version across internet before decompressing, or stream the files */
        const url = require('url');
        const files = await Promise.all(results.map(async (o) => {
            const path = './src/resources/songs/' + o.song_id + '.' + o.ext;
            console.log(path);
            return {
                file: createReadableStreamFromReadable(fs.createReadStream(path)), id: o.song_id};
        }));
        console.log(files);
        return files;
    }
    catch (err) {
        console.warn((err as Error).message);
        return err;
    }
}