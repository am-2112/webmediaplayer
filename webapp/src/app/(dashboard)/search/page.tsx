import mysql from 'mysql2/promise'
import AudioListWrapper from '../../libs/Audio'

export default async function Page(props) {
    const searchResults = new URLSearchParams(await props.searchParams);
    console.log(searchResults);
    const query = searchResults.get('query');

    console.log("found search query: " + query);
    let id = "search-results ? " + query;

    //this doesn't update on further search queries
    //also, need to implement ajax stuff in the near future
    //also look into implementing the temp loading icons before stuff is actually loaded
    return (
        <div id={id}>
            <AudioListWrapper query={ query }></AudioListWrapper>
        </div>
    )
}