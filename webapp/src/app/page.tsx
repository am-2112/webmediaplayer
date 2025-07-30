import Script from 'next/script'
import $ from 'jquery'
import AudioListWrapper from '../app/libs/Audio.tsx'

/** The home page by default will display image metadata for any local songs still saved on cache / localstorage if there are any (see how to check localstorage) */

export default function Page() {
    return (
        <div id="main-content" className="fullSize">
            <AudioListWrapper local={true}></AudioListWrapper>
        </div>
    )
}