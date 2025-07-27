import jsmediatags from 'jsmediatags-web'
import React from 'react'
import Image from 'next/image'
import mysql from 'mysql2/promise'

import '@/app/styles/global.css';

/** this class also determines limit and offset for audio files to be loaded in */
export default class ServerAudioList extends React.Component {
    constructor(props) {
        super(props);
        this.state.sql_request = props.sql_req;
        this.state.limit = props.limit;
        this.state.wrapper_id = props.wrapper_id;
    }
    async componentDidMount() {
        try {
            const connection = await mysql.createConnection({
                host: "localhost",
                port: 3306,
                user: "dev",
                password: "password",
                database: "soundtracks"
            })

            console.log("successful connection");

            const [results] = await connection.execute(this.state.sql_request + ` LIMIT ` + this.state.limit + `OFFSET 0`);
            if (results) {
                console.log("results: ");
                console.log(results);

                this.state.offset += this.state.limit;

                const [fileNames] = results.map(function (song_id, title, artists, ext, upload_date) {
                    return './src/resources/songs/' + song_id + '.' + ext;
                });

                this.readFiles(fileNames);
            }
        }
        catch (err) {
            console.warn((err as Error).message);
        }

        /** monitor edge of current content to load more content */
        let self = this;
        window.addEventListener('scroll', async function () {
            let lastContent = self.state.children[self.state.children.length - 1]
            let wrapper = document.getElementById(self.state.wrapper_id);
            if (wrapper.scrollTop + wrapper.offsetHeight + 100 > lastContent.offsetHeight) {
                /** load in more files */
                try {
                    const connection = await mysql.createConnection({
                        host: "localhost",
                        port: 3306,
                        user: "dev",
                        password: "password",
                        database: "soundtracks"
                    })

                    console.log("successful connection");

                    const [results] = await connection.execute(self.state.sql_request + ` LIMIT ` + self.state.limit + `OFFSET ` + self.state.offset);
                    console.log("results: ");
                    console.log(results);

                    const [fileNames] = results.map(function (song_id, title, artists, ext, upload_date) {
                        return './src/resources/songs/' + song_id + '.' + ext;
                    });

                    if (results) {
                        self.state.offset += self.state.limit;
                        self.readFiles(fileNames);
                    }
                }
                catch (err) {
                    console.warn((err as Error).message);
                }
            }
        })
    }

    state = {
        wrapper_id: '',
        sql_request: ``,
        limit: 0,
        offset: 0,
        children: [],
        song_ind: [],
    }

    render() {
        return (
            <>
                <div className="centered">
                    <div className="audioContainer">
                        {this.state.children}                       
                    </div>
                </div>
            </>
        )
    }

    readFiles(files) {
        for (let i: number = 0; i < files.length; i++) {
            const self = this;
            const name = files[i].name;

            var jsmediatags = window.jsmediatags;
            jsmediatags.read(files[i], {
                onSuccess: function (tag) {

                    const picture = tag.tags.picture;
                    let base64String = "";
                    for (let i = 0; i < picture.data.length; i++) {
                        base64String += String.fromCharCode(picture.data[i]);
                    }
                    const imageUri = "data:" + picture.format + ";base64," + window.btoa(base64String);

                    self.setState(prevState => ({
                        children: [...prevState.children, <self.ServerAudioView key={name} src={imageUri} width={100} height={100} tags={tag.tags} />],
                        song_ind: [...prevState.song_ind, { name }]
                    }))
                    
                },
                onError: function (error) {
                    console.warn("unable to read tags");
                    /** may want to display an empty audioview with an error message here */
                }
            });
        }
    }

    /** react component(function) handling how each audio piece looks; needs the key attribute since it is part of an array above */
    /** since this is same as other audio view, should probably combine them and put the client-only code elsewhere */
    ServerAudioView({ src, width, height, tags }) {
        return (
            <div className="audioViewSize" title={tags.title}>
                <Image className="audioCover" alt={tags.title} src={src} width={width} height={height} />
                <h2 className="audioLabel title">{tags.title}</h2>
                <h3 className="audioLabel artist">{tags.artist}</h3>
            </div>
        )
    }
}