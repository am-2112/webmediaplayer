import mysql from 'mysql2/promise'

export default async function Page(props) {
    const searchResults = new URLSearchParams(await props.searchParams);
    console.log(searchResults);
    const query = searchResults.get('query');

    console.log("found search query: " + query);

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

        /** can use LIMIT [offset, limit] to select limited number of records (can use a small number to test ajax) */
        /** also, need to add an upload_date to the database (for ORDER BY [upload_date] DESC / ASC) */
        let sql_query = 'SELECT * FROM soundtracks.songs WHERE (soundtracks.songs.title LIKE "%' + query + '%") OR (soundtracks.songs.artists LIKE "%' + query + '%");';

        const [results] = await connection.execute(sql_query);
        console.log(results);
    }
    catch (err) {
        console.warn((err as Error).message);
    }
    return (
        <div id="search-results">
            
        </div>
    )
}