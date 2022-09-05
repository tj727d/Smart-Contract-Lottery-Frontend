import { MoralisProvider } from "react-moralis";
import "../styles/globals.css";
import { NotificationProvider } from "@web3uikit/core";

function MyApp({ Component, pageProps }) {
    //initialize on mount allows you to hook into a server for additional functionality if needed
    return (
        <MoralisProvider initializeOnMount={false}>
            <NotificationProvider>
                <Component {...pageProps} />
            </NotificationProvider>
        </MoralisProvider>
    );
}

export default MyApp;
