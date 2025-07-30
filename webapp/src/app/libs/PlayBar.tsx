'use client'

import React, { createContext, useContext, useState } from "react";
import Image from 'next/image'

import playButton from '@/resources/images/play-button.png'
import nextButton from '@/resources/images/next-button.png'
import prevButton from '@/resources/images/prev-button.png'
import shuffleButton from '@/resources/images/shuffle-button.png'
import loopButton from '@/resources/images/loop-button.png'
import pauseButton from '@/resources/images/pause-button.png'

//context will hold a PlayBar which can be gotten using useContext, and therefore placed into the layout using such; maybe there can be a second value in the context which will be a callback function (bound to the current PlayBar instance) with parameter to audio list and integer for current view to play (each time called, will switch)
export const PlayContext = createContext();

/** once the play button in an AudioList is clicked, it will register itself with the current PlayBar (PlayBar will do nothing while currentAudioList is null) */
/** it will then use the PlayBar to play audio from the current audio view selected (also fed into the PlayBar) */
export default class PlayBar extends React.Component { //removed extends
    state = {
        currentAudioList: null,
        currentAudioView: -1, //indexing into the audio list's children
        current: 0,
        duration: 0,
        paused: false,
        stream: null
    }

    currentAudioList = null;
    currentAudioView = -1;

    /** will handle resetting external audio lists (ie. not the calling one) */
    setAudio(playList, viewIndex) {
        console.log("setting audio: ");

        //reset external (previous) list
        if (playList != this.state.currentAudioList && this.state.currentAudioList != null) {
            console.log("callback - stopping previous (ext) list");
            this.state.currentAudioList.setState({ running: false, running_view_ind: -1 });

        }
        if (playList != null) {
            if (playList == this.state.currentAudioList && viewIndex == this.state.currentAudioView) {
                console.log("callback - pause/play current view");
                this.setState(prevState => ({ paused: !prevState.paused }), () => {
                    if (!this.state.paused) { this.playAudio(); }
                });

            } else if (playList == this.state.currentAudioList) {
                console.log("callback - play new view from current list");
                this.setState({ currentAudioList: playList, currentAudioView: viewIndex, current: 0, duration: playList.state.metadata[viewIndex].format.duration, paused: false }, this.playAudio())

            } else {
                console.log("callback - playing new");
                this.setState({ currentAudioList: playList, currentAudioView: viewIndex, current: 0, duration: playList.state.metadata[viewIndex].format.duration, paused: false }, this.playAudio())

            }
        }
    }

    playAudio() {
        console.log("playing");
        //get index to file, begin playing (should put in separate function as callback for setState)
        //also want to change stream state (will need to stop playing (if stream already exists), then create new stream for the new audio selected)


    }

    pauseAudio() {
        console.log("pausing");
        //need to stop playing from the current audio stream

    }


    render() {
        let playsrc = playButton;
        if (this.state.paused || this.state.currentAudioList == null) {
            playsrc = playButton;
        } else {
            playsrc = pauseButton;
        }

        return (
            <PlayContext.Provider value={[this]}>
                {this.props.children}
                <div className="centered bar">
                    <div className="limitAspect">
                        <div className="left spaced-vertical start-play-bar">
                            <Image className="spaced" src={prevButton} alt="prev" width="30"></Image>
                            <Image className="spaced" src={playsrc} alt="play" width="30"></Image>
                            <Image className="spaced" src={nextButton} alt="next" width="30"></Image>
                            <Image className="extra-spaced" src={shuffleButton} alt="shuffle" width="30"></Image>
                            <Image className="spaced" src={loopButton} alt="loop" width="30"></Image>
                        </div>
                    </div>
                </div>
            </PlayContext.Provider>
        )
    }
}