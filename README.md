# webmediaplayer
Creating a web media player for local music playback, as well as displaying songs available on the server.


The user can play their sound files locally by 'uploading' them to the site client-side and the files will be loaded into the site locally.

The media player will support all standard things like playlists, randomisers, and favourited songs.

If only playing locally, then cookies and such can be saved on the client's machine to save said playlists and such (to avoid managing storage for the web server).

The user can also use a search bar to look through songs available on the webserver, which will be loaded async (ajax).

## Deploying on a personal server:

First, a MySQL server will need to be set up.
The web server expects the database formatted in the following: {
	db "soundtracks"
		table "songs"
			-primary key song_id
			-varchar title
			-varchar artists
			-varchar ext
			-datetime upload_date
},
and for all the songs referenced in the database to be held in webapp/src/resources/songs; where the filenames will be "[song_id].[ext]".

Eventually, .env variables will be exposed for specifying custom ip and login details to connect to the desired database for production (rather than using localhost)

The server can be run using the following commands within cmd:

```bash
cd [webapp-path]
npm run start
```

And stopped using ctrl+c.