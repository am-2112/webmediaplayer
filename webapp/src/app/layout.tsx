import '@/app/styles/global.css';

import Link from 'next/link'
import Image from 'next/image'
import SearchBar from '../app/libs/SearchBar.tsx'
import PlayBar from '../app/libs/PlayBar.tsx'

export default function RootLayout({
    children,
}: {
        children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <div className="toolbar centered sticky">
                    <div className="centered">
                        <Image src="/favicon.ico" alt="img" width="50" height="50"></Image>
                        <nav className="spaced self-center">
                            <Link id="Home Link" className="spaced" href="../">Home</Link>
                            <Link id="Library Link" className="spaced" href="/library">Library</Link>
                        </nav>
                        <SearchBar></SearchBar>
                    </div>
                </div>
                <PlayBar>
                    <div className="centered">
                        {children}
                    </div>
                </PlayBar>
            </body>
        </html>
    )
}