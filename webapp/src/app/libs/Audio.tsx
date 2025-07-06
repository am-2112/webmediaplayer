'use client'

import jsmediatags from 'jsmediatags-web'
import React from 'react'
import Image from 'next/image'

import '@/app/styles/global.css';

export default class AudioList extends React.Component {
    /**
     * when loading in a new audio file, when the success callback returns, it will create html to represent the metadata and then add it to children (changing the state, causing a re-render below)
     */
    state = {
        children: [],
    }

    render() {
        return (
            <>
                <div className="centered">
                    <div className="audioContainer">
                        {this.state.children}     
                    </div>
                </div>
                <input type="file" id="audio-files" name="audio-files" accept="audio/*" multiple onChange={this.getUploadedFiles.bind(this)} />   
            </>
        )
    }

    getUploadedFiles(input) {
        console.log("changed");
        /** because this is asyncronous, may need to attach the below code into it as a callback function */

        var files = input.target.files;
        let self = this;

        /** if no files have been selected, user must have pressed x to cancel any changes (ie. only make changes if files have changed) */
        if (files > 0) {
            this.setState({
                children: []
            });
        }

        var files = input.target.files;
        for (let i: number = 0; i < files.length; i++) {
            var name = files[i].name;
            jsmediatags.read(files[i], {
                onSuccess: function (tag) {
                    var picture = tag.tags.picture;
                    var base64String = "";
                    for (var i = 0; i < picture.data.length; i++) {
                        base64String += String.fromCharCode(picture.data[i]);
                    }
                    var imageUri = "data:" + picture.format + ";base64," + window.btoa(base64String);

                    self.setState(prevState => ({ children: [...prevState.children, <self.AudioView key={name} src={imageUri} width={100} height={100} tags = { tag.tags } /> ]}))

                },
                onError: function (error) {
                    console.warn("unable to read tags");
                }
            });
        }
    }

    /** react component(function) handling how each audio piece looks; needs the key attribute since it is part of an array above */
    AudioView({src, width, height, tags }) {
        return (
            <div className="audioViewSize" title={tags.title }>
                <Image className="audioCover" alt={tags.title} src={src} width={width} height={height} />
                <h2 className="audioLabel title">{tags.title}</h2>
                <h3 className="audioLabel artist">{tags.artist}</h3>
            </div>
        )
    }

}