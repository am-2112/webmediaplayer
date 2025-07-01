'use client'

import Script from 'next/script'
import $ from 'jquery'
import jsmediatags from 'jsmediatags-web'

/** The home page by default will display image metadata for any local songs still saved on cache / localstorage if there are any (see how to check localstorage) */

export default function Page() {
    return (
        <div id="main-content" onLoad={GetUploadedFiles}>
            <input type="file" id="audio-files" name="audio-files" accept="audio/*" multiple onChange={GetUploadedFiles}></input>
        </div>
    )
}

function GetUploadedFiles(input) {
    console.log("changed"); 

    var files = input.target.files;
    for (let i = 0; i < files.length; i++) {
        DisplayFileMetadata(files[i]);
    }
}

/** I may want to create a custom class (see react documentation) for the metadata to format it properly, and then another class to contain multiple songs together */
function DisplayFileMetadata(file) {
    var name = file.name;
    console.log(name);

    jsmediatags.read(file, {
        onSuccess({ tags }) {
            console.log(tags);
            var picture = tags.picture;
            var base64String = "";
            for (var i = 0; i < picture.data.length; i++) {
                base64String += String.fromCharCode(picture.data[i]);
            }
            var imageUri = "data:" + picture.format + ";base64," + window.btoa(base64String);
            console.log(imageUri);

            $('#main-content').append('<img src="' + imageUri + '" width="100" height="100"> </img>');
        },
        onError(error: Error) {
            console.log("error");
            console.log(error);
            /** this may happen due to there not being a suitable tag reader (eg. for OPUS files) so i may need to create my own audio library for all of the formats to work properly
             *  look into how creating js libraries works (like how importing actually works and stuff) so i can start developing this (hopefully the default libs support playing all formats, and i only have to code tag readers, but probably not)
             */
        }
    });  
}