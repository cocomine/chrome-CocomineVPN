import React, {useCallback} from "react";
import useProxyData from "../hooks/useProxyData";
import {Col, FormCheck, Row} from "react-bootstrap";
import FormCheckInput from "react-bootstrap/FormCheckInput";
import useProxyMode from "../hooks/useProxyMode";
import useChatGPTOnlyData from "../hooks/useChatGPTOnlyData";


/**
 * ChatGPTOnly component
 *
 * This component provides a UI to toggle the "ChatGPT Only Mode".
 * When enabled, it proxies only the chatgpt.com and openai.com websites.
 *
 */
export const ChatGPTOnly: React.FC = () => {
    const {vmData} = useProxyData();
    const {chatGPTOnly} = useChatGPTOnlyData();
    const {mode} = useProxyMode();

    const onChatGPTOnlyChange = useCallback(() => {
        if (chrome.proxy === undefined || chrome.storage === undefined) return
        chrome.storage.local.set({chatGPTOnly: !chatGPTOnly}) // toggle chatGPTOnly

        if (vmData === null) return;

        // reconnect
        chrome.runtime.sendMessage({type: "Connect", data: vmData});
    }, [chatGPTOnly, vmData])

    return (
        <div className="section glow">
            {mode !== "disable" &&
                <div className="black-cover">
                    <Row className="justify-content-center align-items-center h-100">
                        <Col xs={'auto'} className="text-center">
                            <i className="bi bi-slash-circle fs-1"></i>
                            <p>請先停用自訂代理規則</p>
                        </Col>
                    </Row>
                </div>
            }
            <Row className="justify-content-center align-content-center">
                <Col xs={'auto'}>
                    <h5>OpenAI Mode</h5>
                </Col>
                <div className="w-100"></div>
                <Col xs={'auto'}>
                    <small className="text-muted text-center"><p>開啟後只代理chatgpt.com, openai.com, sora.com的網站</p></small>
                </Col>
                <Col xs={'auto'}>
                    <FormCheck type="switch" id="chatGPTOnly">
                        <FormCheckInput type="checkbox" checked={chatGPTOnly && mode === "disable"}
                                        onChange={onChatGPTOnlyChange} style={{width: "4rem", height: "2rem"}}/>
                    </FormCheck>
                </Col>
            </Row>
        </div>
    )
}
