﻿'use client'

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
        child_pointers: [],
        metadata: [],
        files: [],
        cover64: '',
        current_offset: 0,
        query: '',
        local: false,
        running: false,
        running_view_ind: -1,
        prev_view_ind: -1,
        playbar: null,
        prev_view: null, 
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

    externalStateChange() {
        console.log(this.state.running_view_ind)
        if (this.state.running) {
            this.state.child_pointers[this.state.running_view_ind].setState({ paused: false, selected: true });
        } else {
            this.state.child_pointers[this.state.running_view_ind].setState({ paused: true, selected: true });
        }

        if (this.state.prev_view_ind != -1) {
            this.state.child_pointers[this.state.prev_view_ind].setState({ paused: true, selected: false }, () => {
                this.setState({ prev_view_ind: -1 })
            });
        }
    }

    render() {
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

            await this.addOnline(files, 0)
        }
    }

    async addOnline(files, i) {
        if (i >= files.length) { return; }

        const self = this;
        try {
            let streams = files[i].file.tee()
            const metadata = await parseWebStream(streams[0], { duration: true }); //this isn't working with some files (morning light from foreground eclipse) (source of error: Vorbis.js when calling atob() -- may be because of encoding from createReadStream in GetSongs)
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
                    child_pointers: [...prevState.child_pointers, null],
                    children: [...prevState.children, <AudioView key={name} src={imageUri} width={100} height={100} tags={tag} id={prevState.children.length} callback={self.viewClickedCallback.bind(self)} register={self.registerView.bind(self)} />],
                    metadata: [...prevState.metadata, metadata],
                    files: [...prevState.files, streams[1]],
                }), await self.addOnline(files, i + 1))
            }

        } catch (error) {
            console.error("error", error.message);
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

        await this.addLocal(files, 0);
    }

    async addLocal(files, i) {
        if (i >= files.length) { return; }

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
                        child_pointers: [...prevState.child_pointers, null],
                        children: [...prevState.children, <AudioView key={name} src={imageUri} width={100} height={100} tags={tag} id={prevState.children.length} callback={self.viewClickedCallback.bind(self)} register={self.registerView.bind(self)} />],
                        metadata: [...prevState.metadata, metadata],
                        files: [...prevState.files, files[i]],
                    }), await self.addLocal(files, i + 1))
                }
            }
        } catch (error) {
            console.error("error", error.message);
        }
    }

    //should be bound to this class instance before passing on
    async viewClickedCallback(index, current) {
        if (this.state.running) {
            if (this.state.running_view_ind == index) {
                this.state.playbar.setAudio(this, index) //pausing

            } else {
                if (this.state.prev_view != null) {
                    this.state.prev_view.setState({ paused: true, selected: false });
                }

                this.state.playbar.setAudio(this, index) //playing new from existing list
                this.setState({ running_view_ind: index });

            }
        } else {
            if (this.state.prev_view != null) {
                this.state.prev_view.setState({ paused: true, selected: false });
            }

            this.state.playbar.setAudio(this, index) //running new
            this.setState({ running: true, running_view_ind: index });

        }

        this.setState({ prev_view: current });
    }

    //pointers array should be resized before calling this function (especially if use strict)
    registerView(index, view) {
        console.log(index);
        if (this.state.child_pointers.length > index) {
            console.log("replacing");
            const newPointers = this.state.child_pointers.map((c, i) => {
                if (i == index) {
                    return view;
                } else {
                    return c;
                }
            });
            this.setState({ child_pointers: newPointers });
        } else {
            this.setState(prevState => ({ child_pointers: [...prevState.child_pointers, view] }));
        }
    }
}

class AudioView extends React.Component {
    constructor(props) {
        super(props);
        this.props.register(this.props.id, this);
    }

    state = {
        paused: true,
        selected: false
    }

    onClick(id, callback, event) {
        this.setState(prevState => ({ paused: !prevState.paused, selected: true }));
        callback(id, this);
    }

    render() {
        let overlaySource = playButtonSmall;
        if (!this.state.paused) {
            overlaySource = pauseButtonSmall;
        }

        let overlayclass = "overlay";
        if (!this.state.paused || this.state.selected) {
            overlayclass = "permOverlay"
        }

        return (
            <div className="audioViewSize" title={this.props.tags.title}>
                <button className="audioCover container" id={this.props.id} onClick={this.onClick.bind(this, this.props.id, this.props.callback)}>
                    <Image className={overlayclass} alt="play" src={overlaySource} width={this.props.width} height={this.props.height} />
                    <Image className="audioCover" id={this.props.id} alt={this.props.tags.title} src={this.props.src} width={this.props.width} height={this.props.height} />
                </button>
                <h2 className="audioLabel title">{this.props.tags.title}</h2>
                <h3 className="audioLabel artist">{this.props.tags.artist}</h3>
            </div>
        )
    }
}


export default AudioListWrapper(AudioList);