'use client'

import '@/app/styles/global.css';

import React from 'react'
import Image from 'next/image'
import { permanentRedirect } from 'next/navigation'

/** client-side bit to handle onEnter events; will go back to server to load new page with search results */
export default class SearchBar extends React.Component {
    render() {
        return (
            <input className="searchBar spaced self-center" id="Search Bar" type="text" placeholder="Search" onKeyDown={this.search.bind(this) }></input> 
        )
    }


    /** when the user presses enter, should bring up new page with search results (if nothing, then maybe just show all songs ordered by upload date?); not all songs will appear at once, but be loaded with ajax as user scrolls down the page */
    search(input) {
        const query = input.target.value;
        if (input.key == 'Enter' && query != '') {
            console.log(query);

            permanentRedirect('/search?query=' + query);
        }
    }
}