'use client'

import React, { createContext, useContext, useState } from "react";
import Image from 'next/image'

import playButton from '@/resources/images/play-button.png'
import nextButton from '@/resources/images/next-button.png'
import prevButton from '@/resources/images/prev-button.png'
import shuffleButton from '@/resources/images/shuffle-button.png'
import loopButton from '@/resources/images/loop-button.png'
import loopButtonSingle from '@/resources/images/loop-button-single.png'
import loopButtonAll from '@/resources/images/loop-button-all.png'
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
        audio: null,
        url: null,
        intervalID: null, //used to call clearInterval() to stop checking current time when paused
        loop: 0 //0 = no loop (stop when at end of list; if play is pressed after, will just repeat last song); 1 = loop song (reset audio current time back to 0); 2 = loop list (reset currentAudioView back to 0 - by calling playAudio)
    }

    /** will handle resetting external audio lists (ie. not the calling one) */
    /** to be called by external audio lists (when they are clicked, not when the playbar is clicked) */
    setAudio(playList, viewIndex) {
        console.log("setting audio: " + viewIndex);

        //reset external (previous) list
        if (playList != this.state.currentAudioList && this.state.currentAudioList != null) {
            console.log("callback - stopping previous (ext) list");
            this.state.currentAudioList.setState({ running: false, running_view_ind: -1 }, () => {
                this.state.currentAudioList.externalStateChange();
            });

        }
        if (playList != null) {
            if (playList == this.state.currentAudioList && viewIndex == this.state.currentAudioView) {
                console.log("callback - pause/play current view");
                this.setState(prevState => ({ paused: !prevState.paused }), () => {
                    if (!this.state.paused) { this.continueAudio(); } else { this.pauseAudio(); }
                });

            } else if (playList == this.state.currentAudioList) {
                console.log("callback - play new view from current list");
                this.setState({ currentAudioList: playList, currentAudioView: viewIndex, current: 0, duration: playList.state.metadata[viewIndex].format.duration, paused: false }, () => { this.playAudio() })

            } else {
                console.log("callback - playing new");
                this.setState({ currentAudioList: playList, currentAudioView: viewIndex, current: 0, duration: playList.state.metadata[viewIndex].format.duration, paused: false }, () => { this.playAudio() })

            }
        }
    }

    async playAudio() {
        console.log("playing");
        //get index to file, begin playing (should put in separate function as callback for setState)
        //also want to change stream state (will need to stop playing (if stream already exists), then create new stream for the new audio selected)
        if (this.state.audio != null) {
            this.state.audio.pause();
        }
        if (this.state.stream != null) {
            if (this.state.reader != null) {
                this.state.reader.releaseLock();
            }
        }
        if (this.state.url != null) {
            URL.revokeObjectURL(this.state.url);
        }
        clearInterval(this.state.intervalID)
        this.setState({ audio: null, stream: null, reader: null, url: null });

        if (this.state.currentAudioList != null && this.state.currentAudioView != -1) {
            let url = URL.createObjectURL(await new Response(this.state.currentAudioList.state.files[this.state.currentAudioView]).blob());
            let audio = new Audio(url)
            audio.addEventListener("ended", this.onAudioEnd.bind(this))


            let promise = audio.play();
            if (promise != undefined) {
                promise.then(function () {
                    console.log("playback started")
                }).catch(function (error) {
                    console.log("error: " + error)
                })
            }

            let id = setInterval(this.getCurrentTime.bind(this), 1000);

            this.setState({ audio: audio, intervalID: id, url: url });
        }
    }

    getCurrentTime() {
        if (prevState.audio) {
            this.setState(prevState => ({ current: prevState.audio.currentTime }))
        }
    }

    onAudioEnd() {
        console.log("end of audio");

        if (this.state.loop == 0) {
            if (this.state.currentAudioView + 1 >= this.state.currentAudioList.state.children.length) {
                this.setAudio(this.state.currentAudioList, this.state.currentAudioView)
            } else {
                this.nextButtonClicked();
            }

        } else if (this.state.loop == 1) {
            this.state.audio.currentTime = 0;
            this.setState({ current: 0 }, () => { this.state.audio.play() });

        } else if (this.state.loop == 2) {
            if (this.state.currentAudioView + 1 >= this.state.currentAudioList.state.children.length) {
                this.state.currentAudioList.setState({ running: true, prev_view_ind: this.state.currentAudioView, running_view_ind: 0, prev_view: this.state.currentAudioList.state.child_pointers[this.state.currentAudioView - 1] }, () => { this.state.currentAudioList.externalStateChange() })
                this.setState(prevState => ({ paused: false, currentAudioView: 0, current: 0, duration: prevState.currentAudioList.state.metadata[0].format.duration, }), () => { this.playAudio() })
            } else {
                this.nextButtonClicked();
            }
        }
    }

    pauseAudio() {
        console.log("pausing");
        this.state.audio.pause();
    }

    continueAudio() {
        console.log("continuing");
        this.state.audio.play();
    }


    playButtonClicked() {
        if (this.state.currentAudioList == null) {
            return;
        }


        if (this.state.paused) {
            this.state.currentAudioList.setState({ running: true}, () => {
                this.state.currentAudioList.externalStateChange();
            });

            this.setAudio(this.state.currentAudioList, this.state.currentAudioView);

        } else {
            this.state.currentAudioList.setState({ running: false }, () => {
                this.state.currentAudioList.externalStateChange();
            });

            this.setAudio(this.state.currentAudioList, this.state.currentAudioView);
        }
    }

    nextButtonClicked() {
        if (this.state.currentAudioList == null) {
            return;
        }

        if (this.state.loop == 1) {
            this.onAudioEnd()
            return;
        }
        if (this.state.currentAudioView + 1 >= this.state.currentAudioList.state.children.length) {
            if (this.state.loop > 0) {
                this.onAudioEnd()
            }
            return;
        }

        this.state.currentAudioList.setState({ running: true, prev_view_ind: this.state.currentAudioView, running_view_ind: this.state.currentAudioView + 1, prev_view: this.state.currentAudioList.state.child_pointers[this.state.currentAudioView + 1] }, () => { this.state.currentAudioList.externalStateChange() })
        this.setState(prevState => ({ paused: false, currentAudioView: prevState.currentAudioView + 1, current: 0, duration: prevState.currentAudioList.state.metadata[prevState.currentAudioView + 1].format.duration, }), () => { this.playAudio() })
    }
    prevButtonClicked() {
        if (this.state.currentAudioList == null) {
            return;
        }

        if (this.state.currentAudioView - 1 < 0) {
            if (this.state.loop == 1) {
                this.onAudioEnd()
            }
            return;
        }

        this.state.currentAudioList.setState({ running: true, prev_view_ind: this.state.currentAudioView, running_view_ind: this.state.currentAudioView - 1, prev_view: this.state.currentAudioList.state.child_pointers[this.state.currentAudioView - 1] }, () => { this.state.currentAudioList.externalStateChange() })
        this.setState(prevState => ({ paused: false, currentAudioView: prevState.currentAudioView - 1, current: 0, duration: prevState.currentAudioList.state.metadata[prevState.currentAudioView - 1].format.duration, }), () => { this.playAudio() })
    }

    //may want a currently-playing view to show shuffled songs (as user scrolls down in said view, it will load more using this shuffling system); would also work normally to show songs when not shuffled (like sc)
    //not only would this involve multiple views at once, but also communication between views since they would be holding the same data (maybe create a custom shuffle-extended class that takes in the original instance?)
    shuffleButtonClicked() {
        /**
         * for a better shuffling system, can pick random sampling points (eg. 5), then load the regions around those (ie. using them as offsets),
         * then can truly randomly pick between any of the loaded regions, until a certain threshold is met, and then a new region can be loaded from a new sampling point
         * this way, there is a decent-ish spread of songs without having to load all the songs at once (which would be impossible for search results) or having to do many sql selects for just one song at a time (which would be expensive)
         **/


    }

    loopButtonClicked() {
        let newState = this.state.loop + 1;
        if (newState == 3) { newState = 0 };
        this.setState({ loop: newState }, () => {console.log(this.state.loop) });
    }

    onRangeChange(event) {
        if (this.state.currentAudioList != null) {
            this.state.audio.currentTime = event.target.value;
            this.setState({ current: event.target.value });
            if (!this.state.paused) { this.state.audio.play(); }
        }
    }
    onRangeContinuousChange(event) {
        if (this.state.currentAudioList != null) {
            this.setState({ current: event.target.value });
        }
    }

    render() {
        let playsrc = playButton;
        if (this.state.paused || this.state.currentAudioList == null) {
            playsrc = playButton;
        } else {
            playsrc = pauseButton;
        }

        let loopsrc = loopButton;
        if (this.state.loop == 0) {
            loopsrc = loopButton;
        } else if (this.state.loop == 1) {
            loopsrc = loopButtonSingle
        } else if (this.state.loop == 2) {
            loopsrc = loopButtonAll
        }

        let currentMinutes = Math.floor(this.state.current / 60);
        let currentSeconds = String(Math.floor(this.state.current - (currentMinutes * 60)));
        if (currentSeconds.length < 2) {currentSeconds = '0' + currentSeconds }

        let durationMinutes = Math.floor(this.state.duration / 60);
        let durationSeconds = String(Math.floor(this.state.duration - (durationMinutes * 60)));
        if (durationSeconds.length < 2) { durationSeconds = '0' + durationSeconds }

        //setting value in input range stops changes from happening
        return (
            <PlayContext.Provider value={[this]}>
                {this.props.children}
                <div className="centered bar">
                    <div className="limitAspect">
                        <div className="left spaced-vertical start-play-bar">
                            <button onClick={this.prevButtonClicked.bind(this)}>
                                <Image className="spaced" src={prevButton} alt="prev" width="30"></Image>
                            </button>
                            <button onClick={this.playButtonClicked.bind(this)}>
                                <Image className="spaced" src={playsrc} alt="play" width="30"></Image>
                            </button>
                            <button onClick={this.nextButtonClicked.bind(this)}>
                                <Image className="spaced" src={nextButton} alt="next" width="30"></Image>
                            </button>
                            <Image className="extra-spaced" src={shuffleButton} alt="shuffle" width="30"></Image>
                            <button onClick={this.loopButtonClicked.bind(this)}>
                                <Image className="spaced" src={loopsrc} alt="loop" width="30"></Image>
                            </button>
                            <span className="extra-spaced time">{currentMinutes}:{currentSeconds}</span>
                            <input type="range" className="soundmeter" step={0.1} value={this.state.current} min={0} max={this.state.duration} onMouseUp={this.onRangeChange.bind(this)} onChange={this.onRangeContinuousChange.bind(this) } ></input>
                            <span className="spaced end-play-bar time">{durationMinutes}:{durationSeconds}</span>
                        </div>
                    </div>
                </div>
            </PlayContext.Provider>
        )
    }
}