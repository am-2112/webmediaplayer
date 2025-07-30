'use client'

import jsmediatags from 'jsmediatags-web'
import React, { useContext } from 'react'
import Image from 'next/image'

import '@/app/styles/global.css';
import uploadfile from '@/resources/images/upload-file.png'

import GetSongs from '../libs/GetSongs'
import { parseWebStream } from 'music-metadata' /** needed for getting metadata from readableStream */

import fs from 'fs'
import { parseBuffer, selectCover } from 'music-metadata'
import { uint8ArrayToBase64 } from 'uint8array-extras';

import { PlayContext } from '@/app/libs/PlayBar.tsx'

import playButtonSmall from '@/resources/images/play-button-small.png'
import pauseButtonSmall from '@/resources/images/pause-button-small.png'

//may need to be recursive to ensure order and stuff is working as intended (not sure)
function AudioListWrapper(AudioListComponent) {
    return function (props) {
        const [playBar] = useContext(PlayContext);
        return (
            <AudioListComponent playbar={playBar} {...props }></AudioListComponent>
        );
    };
}

class AudioList extends React.Component {
    constructor(props) {
        super(props);
        this.state.query = props.query;
        this.state.local = props.local;
        this.state.playbar = props.playbar;
    }
    async componentDidMount() {
        if (!this.state.local) { await this.request(); } //called twice (because of strict?)
    }

    state = {
        children: [],
        metadata: [],
        files: [],
        cover64: '',
        current_offset: 0,
        query: '',
        local: false,
        running: false,
        running_view_ind: -1,
        playbar: null,
        prev_view: null
    }

    async componentDidUpdate(prevProps) {
        if (prevProps.query != this.props.query) {
            this.setState({
                children: [],
                metadata: [],
                current_offset: 0,
                query: this.props.query
            }, async () => {
                if (!this.state.local) {
                    await this.request();
                }
            });
            
        }
    }

    render() {
        if (!this.state.running && this.state.prev_view != null) { //to ensure that child views will have correct overlay when state change from play bar
            this.state.prev_view.setState({ paused: true });
        }

        if (this.state.local) {
            return (
                <>
                    <div className="centered">
                        <div className="audioContainer">
                            {this.state.children}
                            <label className="uploadLabel audioViewSize" htmlFor="audio-files">
                                <Image className="centered" src={uploadfile} alt="upload-file" width="100" height="100"></Image>
                                <input type="file" id="audio-files" name="audio-files" accept="audio/*" className="hidden" multiple onChange={this.getUploadedFiles.bind(this)} />
                                <label className="audioLabel centered" htmlFor="audio-files">Upload File</label>
                            </label>
                        </div>
                    </div>
                </>
            )
        } else {
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
    }

    /** using ajax to request more songs from server based on query and current offset (need to look into preventing sql injection from here though) */
    async request() {
        console.log("getting files: " + this.state.query);
        const files = await GetSongs(this.state.query, this.state.current_offset);
        if (files) {
            this.setState(prevState => ({
                current_offset: prevState.current_offset + files.length
            }))
            console.log("finished getting files");
            console.log(this.state.current_offset);

            for (let i: number = 0; i < files.length; i++) {
                const self = this;
                try {
                    const metadata = await parseWebStream(files[i].file, {duration : true}); //this isn't working with some files (morning light from foreground eclipse) (source of error: Vorbis.js when calling atob() -- may be because of encoding from createReadStream in GetSongs)
                    console.log(metadata);
                    let name = files[i].id;
                    metadata.song_id = name; //add song_id entry here to ensure no duplicates, and for compatibility with local mode
                    let picture = selectCover(metadata.common.picture);
                    let imageUri = 'data:' + picture.format + ';charset=utf-8;base64,' + await this.bufferToBase64(picture.data); //image loading problem for some cover arts (not fully displayed for some reason - the base64 doesn't produce full image - also happens locally (library issue then?))

                    let tag = {
                        song_id: name,
                        title: metadata.common.title,
                        artist: metadata.common.artist,
                        length: -1
                    };

                    /** will want to check here to prevent adding duplicate files (check names against current) */
                    let alreadyPresent = false;
                    for (let i = 0; i < self.state.metadata.length; i++) {
                        let currentName = self.state.metadata[i].song_id;
                        if (currentName == name) { /** identical file already present on site, therefore return early */
                            alreadyPresent = true;
                            break;
                        }
                    }

                    if (!alreadyPresent) {
                        console.log("adding audio view")
                        self.setState(prevState => ({
                            children: [...prevState.children, <AudioView key={name} src={imageUri} width={100} height={100} tags={tag} id={prevState.children.length} callback={self.viewClickedCallback.bind(self)} />],
                            metadata: [...prevState.metadata, metadata],
                            files: [...prevState.files, files[i].file],
                        }))
                    }

                } catch (error) {
                    console.error("error", error.message);
                }
            }
        }
    }

    async bufferToBase64(buffer) {
    // use a FileReader to generate a base64 data URI:
        const base64url = await new Promise(r => {
            const reader = new FileReader()
            reader.onload = () => r(reader.result)
            reader.readAsDataURL(new Blob([buffer]))
        });
        // remove the `data:...;base64,` part from the start
        return base64url.slice(base64url.indexOf(',') + 1);
    }

    async getUploadedFiles(input) {
        console.log("changed");
        let files = input.target.files;
        let self = this;

        for (let i: number = 0; i < files.length; i++) {
            const self = this;
            try {
                const reader = new FileReader();

                reader.readAsArrayBuffer(files[i]);
                reader.onload = await async function () {
                    const buffer = this.result; //fs.readFileSync(files[i]);
                    const metadata = await parseBuffer(Buffer.from(buffer)); //this isn't working with some files (morning light from foreground eclipse) (source of error: Vorbis.js when calling atob() -- may be because of encoding from createReadStream in GetSongs)

                    let name = Number(files[i].name.split('.').slice(0, -1).join('.'));
                    let picture = metadata.common.picture;
                    let imageUri = "data:" + picture[0].format + ";charset=utf-8;base64," + await self.bufferToBase64(picture[0].data);

                    let tag = {
                        song_id: name,
                        title: metadata.common.title,
                        artist: metadata.common.artist,
                        length: -1
                    };

                    /** will want to check here to prevent adding duplicate files (check names against current) */
                    let alreadyPresent = false;
                    for (let i = 0; i < self.state.metadata.length; i++) {
                        let currentName = self.state.metadata[i].song_id;
                        if (currentName == name) { /** identical file already present on site, therefore return early */
                            alreadyPresent = true;
                            break;
                        }
                    }

                    if (!alreadyPresent) {

                        self.setState(prevState => ({
                            children: [...prevState.children, <AudioView key={name} src={imageUri} width={100} height={100} tags={tag} id={prevState.children.length} callback={self.viewClickedCallback.bind(self)} />],
                            metadata: [...prevState.metadata, metadata],
                            files: [...prevState.files, files[i]],
                        }))
                    }
                }
            } catch (error) {
                console.error("error", error.message);
            }
        }
    }

    //should be bound to this class instance before passing on
    async viewClickedCallback(index, current) {
        if (this.state.running) {
            if (this.state.running_view_ind == index) {
                this.state.playbar.setAudio(this, index) //pausing

            } else {
                if (this.state.prev_view != null) {
                    this.state.prev_view.setState({ paused: true });
                }

                this.state.playbar.setAudio(this, index) //playing new from existing list
                this.setState({ running_view_ind: index });

            }
        } else {
            if (this.state.prev_view != null) {
                this.state.prev_view.setState({ paused: true });
            }

            this.state.playbar.setAudio(this, index) //running new
            this.setState({ running: true, running_view_ind: index });

        }

        this.setState({ prev_view: current });
    }
}

class AudioView extends React.Component {
    constructor(props) {
        super(props);
    }

    state = {
        paused: true
    }

    //now need a solution to set paused back to unpaused when a different view is clicked on
    onClick(id, callback, event) {
        this.setState(prevState => ({ paused: !prevState.paused }));
        callback(id, this);
    }

    render() {
        let overlaySource = playButtonSmall;
        if (!this.state.paused) {
            overlaySource = pauseButtonSmall;
        }

        return (
            <div className="audioViewSize" title={this.props.tags.title}>
                <button className="audioCover container" id={this.props.id} onClick={this.onClick.bind(this, this.props.id, this.props.callback)}>
                    <Image className="overlay" alt="play" src={overlaySource} width={this.props.width} height={this.props.height} />
                    <Image className="audioCover" id={this.props.id} alt={this.props.tags.title} src={this.props.src} width={this.props.width} height={this.props.height} />
                </button>
                <h2 className="audioLabel title">{this.props.tags.title}</h2>
                <h3 className="audioLabel artist">{this.props.tags.artist}</h3>
            </div>
        )
    }
}


export default AudioListWrapper(AudioList);