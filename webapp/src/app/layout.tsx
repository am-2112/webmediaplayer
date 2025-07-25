import '@/app/styles/global.css';

import Link from 'next/link'
import Image from 'next/image'

export default function RootLayout({
    children,
}: {
        children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <div className="toolbar centered sticky">
                    <Image src="/favicon.ico" alt="img" width="50" height="50"></Image>
                    <nav className="spaced self-center">
                        <Link id="Home Link" className="spaced" href="../">Home</Link>
                        <Link id="Library Link" className="spaced" href="/library">Library</Link>
                    </nav>
                    <input className="searchBar spaced self-center" id="Search Bar" type="text" placeholder="Search"></input>
                </div>
                <div className="centered">
                    {children}
                </div>
            </body>
        </html>
    )
}