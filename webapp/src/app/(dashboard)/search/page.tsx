import mysql from 'mysql2/promise'
import {AudioList} from '../../libs/Audio'

export default async function Page(props) {
    const searchResults = new URLSearchParams(await props.searchParams);
    console.log(searchResults);
    const query = searchResults.get('query');

    console.log("found search query: " + query);

    //this doesn't update on further search queries
    //also, need to add many more songs to test out ajax stuff in the near future
    //also look into implementing the temp loading icons before stuff is actually loaded
    //also sometimes audiolist tries to get files twice, resulting in duplicate entries (can check for duplicates, but should also debounce / try to fix the cause)
    return (
        <div id="search-results">
            <AudioList query={ query }></AudioList>
        </div>
    )
}