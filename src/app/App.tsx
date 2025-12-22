import {Button, Col, Row} from "react-bootstrap";
import React, {useCallback, useMemo} from "react";
import moment from "moment";
import useProxyData from "../hooks/useProxyData";
import BlackWhiteList from "../components/BlackWhiteList";
import {LinkStatus} from "../components/LinkStatus";
import {TimeLast} from "../components/TimeLast";
import {ChatGPTOnly} from "../components/ChatGPTOnly";
import {APP_VERSION} from "../constants/GlobalVariable";


/**
 * App component
 *
 * This component is the main application component that handles the VPN connection status,
 * displays the connection information, and provides a link to the GitHub repository.
 *
 */
function App() {
    const {connected, country, vmData} = useProxyData();
    const audio = useMemo(() => new Audio(require('../assets/Jig 1.mp3')), []);

    // toggle click event
    const onDisconnect = useCallback(async () => {
        if (connected) {
            // disconnect
            // check if chrome.proxy and chrome.storage is undefined
            if (chrome.runtime === undefined) return

            const res = await chrome.runtime.sendMessage({type: "Disconnect", data: vmData});
            if (res.connected === false) {
                audio.play();
            }
        } else {
            // open vpn.cocomine.cc
            window.open('https://vpn.cocomine.cc', '_blank')
            return
        }
    }, [connected, audio, vmData]);

    return (
        <>
            <Row className={"g-0"}>
                <Col>
                    <LinkStatus connectedProp={connected} countryProp={country} onDisconnect={onDisconnect} vmName={vmData?._name ?? country}/>
                    {vmData && <TimeLast vmData={vmData}/>}
                    <ChatGPTOnly/>
                </Col>
                <Col>
                    <BlackWhiteList/>
                </Col>
            </Row>
            <Row className="justify-content-between" style={{fontSize: "0.7em", padding: "5px"}}>
                <Col xs="auto">
                    <span>Build by © {moment().format("yyyy")} <a
                        href="https://github.com/cocomine" target="_blank"
                        rel="noopener noreferrer">cocomine</a>.</span>
                    <br/>
                    <span className="text-muted">{APP_VERSION}</span>
                </Col>
                <Col xs="auto">
                    <Button variant="link" href="https://github.com/cocomine/chrome-vpn" target="_blank"
                            rel="noopener noreferrer">
                        <i className="bi bi-github me-2"></i>
                    </Button>
                </Col>
            </Row>
        </>
    )
}

export default App;
