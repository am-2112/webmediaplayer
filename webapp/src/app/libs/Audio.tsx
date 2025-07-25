'use client'

import jsmediatags from 'jsmediatags-web'
import React from 'react'
import Image from 'next/image'

import '@/app/styles/global.css';
import uploadfile from '@/resources/upload-file.png'

export default class AudioList extends React.Component {
    /**
     * when loading in a new audio file, when the success callback returns, it will create html to represent the metadata and then add it to children (changing the state, causing a re-render below)
     */
    state = {
        children: [],
        names: [],
    }

    render() {
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
    }

    getUploadedFiles(input) {
        console.log("changed");
        var files = input.target.files;
        let self = this;

        var files = input.target.files;
        for (let i: number = 0; i < files.length; i++) {
            const name = files[i].name;
            console.log(files[i]);
            jsmediatags.read(files[i], {
                onSuccess: function (tag) {
                    /** will want to check here to prevent adding duplicate files (check names against current) */
                    let alreadyPresent = false;
                    console.log(self.state.names);
                    for (var i = 0; i < self.state.names.length; i++) {
                        console.log(self.state.names[i]);
                        var currentName = self.state.names[i].name;
                        if (currentName == name) { /** identical file already present on site, therefore return early */
                            alreadyPresent = true;
                            break;
                        }
                    }

                    if (!alreadyPresent) {
                        var picture = tag.tags.picture;
                        var base64String = "";
                        for (var i = 0; i < picture.data.length; i++) {
                            base64String += String.fromCharCode(picture.data[i]);
                        }
                        var imageUri = "data:" + picture.format + ";base64," + window.btoa(base64String);

                        self.setState(prevState => ({
                            children: [...prevState.children, <self.AudioView key={name} src={imageUri} width={100} height={100} tags={tag.tags} />],
                            names: [...prevState.names, { name }]
                        }))
                    }
                },
                onError: function (error) {
                    console.warn("unable to read tags");
                    /** may want to display an empty audioview with an error message here */
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