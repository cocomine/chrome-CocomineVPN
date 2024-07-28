import {Button, ButtonGroup, CloseButton, Col, Modal, Row} from "react-bootstrap";
import React, {CSSProperties, useCallback, useState} from "react";
import Scrollbar, {positionValues} from "react-custom-scrollbars";
import {ProxyMode, useProxyMode} from "./blackWhiteListData";

const BlackWhiteList = () => {

    const {mode} = useProxyMode(); // get the proxy mode
    const [show, setShow] = useState(false); // show add url modal
    const [maskTop, setMaskTop] = useState('black'); // list top mask color
    const [maskBottom, setMaskBottom] = useState('transparent') // list bottom mask color

    /* handle delete event and delete the url */
    const onDelete = useCallback((url: string) => {
        console.log(url)
    }, [])

    /* handle scroll events and update the mask colors based on the scroll position. */
    const onScroll = useCallback((values: positionValues) => {
        console.log(values)
        setMaskTop(values.top <= 0.15 ? `rgba(0,0,0,${(values.top - 0.15) / (0 - 0.15)})` : 'transparent')
        setMaskBottom(values.top >= 0.85 ? `rgba(0,0,0,${(values.top - 0.85) / (1 - 0.85)})` : 'transparent')
    }, [])

    /* handle proxy mode change event */
    const onProxyModeChange = useCallback((mode: ProxyMode) => {
        // Check if chrome.storage is available
        if(chrome.storage === undefined) return;

        // Set the proxyMode to chrome.storage.local
        chrome.storage.local.set({proxyMode: mode}, () => {
            console.log(`Proxy mode set to ${mode}`)
        });
    }, [])

    return (
        <>
            <div className="section glow h-100">
                <Row className="justify-content-center align-content-around h-100 flex-column">
                    <Col xs={'auto'}>
                        <h5>自訂代理網站規則</h5>
                    </Col>
                    <Col xs={'auto'}>
                        <ButtonGroup aria-label="代理模式" size={"sm"} className="w-100">
                            <Button variant={mode === "whitelist" ? "primary" : "outline-primary"}
                                    className={"rounded-start-5"}
                                    onClick={() => onProxyModeChange('whitelist')}>白名單模式</Button>
                            <Button variant={mode === "disable" ? "secondary" : "outline-secondary"}
                                    onClick={() => onProxyModeChange('disable')}>禁用</Button>
                            <Button variant={mode === "blacklist" ? "primary" : "outline-primary"}
                                    className={"rounded-end-5"}
                                    onClick={() => onProxyModeChange('blacklist')}>黑名單模式</Button>
                        </ButtonGroup>
                    </Col>
                    <Col className="position-relative">
                        <div className={'list'}
                             style={{'--mask-top': maskTop, '--mask-bottom': maskBottom} as CSSProperties}>
                            <Scrollbar style={{height: '100%'}} onUpdate={onScroll}>
                                <ul>
                                    <li>chatgpt.com <CloseButton className={"float-end"}
                                                                 onClick={() => onDelete('chatgpt.com')}/>
                                    </li>
                                    <li>openai.com <CloseButton className={"float-end"}
                                                                onClick={() => onDelete('openai.com')}/>
                                    </li>
                                    <li>google.com <CloseButton className={"float-end"}
                                                                onClick={() => onDelete('google.com')}/>
                                    </li>
                                </ul>
                            </Scrollbar>
                        </div>
                    </Col>
                    <Col xs={'auto'}>
                        <Button variant="primary" className="w-100 rounded-5" onClick={() => setShow(true)}><i
                            className="bi bi-plus-lg me-2"></i>添加目前網站</Button>
                    </Col>
                </Row>
            </div>
            <AddURLModal show={show} onHide={() => setShow(false)}/>
        </>
    );
}


/**
 * Component for adding URLs to either a whitelist or a blacklist.
 */
const AddURLModal: React.FC<{ show: boolean, onHide: () => void }> = ({show, onHide}) => {

    /**
     * Callback function to handle adding a URL to the whitelist.
     */
    const onAddWhiteList = useCallback(() => {
        console.log('add white list')
    }, []);

    /**
     * Callback function to handle adding a URL to the blacklist.
     */
    const onAddBlackList = useCallback(() => {
        console.log('add black list')
    }, []);

    return (
        <Modal show={show} fullscreen onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>添加網站</Modal.Title>
            </Modal.Header>
            <Modal.Body>Modal body content</Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={onAddWhiteList} className="rounded-5">
                    添加到白名單
                </Button>
                <Button variant="primary" onClick={onAddBlackList} className="rounded-5">
                    添加到黑名單
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default BlackWhiteList;