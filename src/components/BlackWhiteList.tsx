import {Button, ButtonGroup, CloseButton, Col, Form, Modal, Row} from "react-bootstrap";
import React, {CSSProperties, useCallback, useEffect, useMemo, useState} from "react";
import Scrollbar, {positionValues} from "react-custom-scrollbars";
import useBlackWhiteListData from "../hooks/useBlackWhiteListData";
import DynamicText from "./DynamicText";
import useProxyData from "../hooks/useProxyData";
import useProxyMode, {ProxyMode} from "../hooks/useProxyMode";
import {AddURLModalProps, MaskType, StorageLists, URLSelectorProps} from "../extension/types";

const COLORS_LIST = ["#ffbe0b", "#fb5607", "#ff006e", "#8338ec", "#3a86ff"] //colors for the rainbow effect

/**
 * Component for managing the Black and White list of URLs.
 */
const BlackWhiteList = () => {

    const {vmData} = useProxyData();
    const whitelist = useBlackWhiteListData("whitelist") // get the whitelist data
    const blacklist = useBlackWhiteListData("blacklist") // get the blacklist data
    const {mode} = useProxyMode(); // get the proxy mode
    const [show, setShow] = useState(false); // show add url modal
    const [maskTop, setMaskTop] = useState<MaskType>('black'); // list top mask color
    const [maskBottom, setMaskBottom] = useState<MaskType>('transparent') // list bottom mask color
    const [activeURL, setActiveURL] = useState("") // active url

    /* handle delete event and delete the url */
    const onDelete = useCallback(async (url: string) => {
        // Check if chrome.storage is available
        if (chrome.storage === undefined) return;

        // white list
        if (mode === "whitelist") {
            const tmp = whitelist.data.filter((item) => item !== url)
            await chrome.storage.sync.set({whitelist: tmp});
        }
        // black list
        else {
            const tmp = blacklist.data.filter((item) => item !== url)
            await chrome.storage.sync.set({blacklist: tmp});
        }

        console.log(`${url} removed from ${mode}`)
    }, [blacklist.data, mode, whitelist.data])

    /* handle scroll events and update the mask colors based on the scroll position. */
    const onScroll = useCallback((values: positionValues) => {
        setMaskTop(values.top <= 0.15 ? `rgba(0,0,0,${(values.top - 0.15) / (0 - 0.15)})` : 'transparent')
        setMaskBottom(values.top >= 0.85 ? `rgba(0,0,0,${(values.top - 0.85) / (1 - 0.85)})` : 'transparent')
    }, [])

    /* handle proxy mode change event */
    const onProxyModeChange = useCallback(async (mode: ProxyMode) => {
        // Check if chrome.storage is available
        if (chrome.storage === undefined) return;

        // Set the proxyMode to chrome.storage.local
        await chrome.storage.local.set({proxyMode: mode});
        console.log(`Proxy mode set to ${mode}`)

        // reconnect with the new mode
        if (vmData === null) return;
        await chrome.runtime.sendMessage({type: "Connect", data: vmData});
    }, [vmData])

    /* handle add event */
    const onAdd = useCallback(async () => {
        // Check if chrome.tabs is available
        if (chrome.tabs === undefined) return;

        // Get the active tab url
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs[0].url === undefined) return;

        setActiveURL(tabs[0].url)
        setShow(true)
    }, [])

    /* memoized list component */
    const list = useMemo(() => {
        if (mode === "whitelist") {
            return (
                <ul>
                    {whitelist.data.map((url) =>
                        <li className={'text-truncate'}><CloseButton className={"float-end"}
                                                                     onClick={() => onDelete(url)}/><span>{url}</span>
                        </li>
                    )}
                    <li>
                        <div className="text-center text-muted">
                            <i className="bi bi-chevron-bar-down fs-1"></i>
                            <p>已經在最底了</p>
                        </div>
                    </li>
                </ul>)
        } else if (mode === "blacklist") {
            return (
                <ul>
                    {blacklist.data.map((url) =>
                        <li className={'text-truncate'}><CloseButton className={"float-end"}
                                                                     onClick={() => onDelete(url)}/><span>{url}</span>
                        </li>
                    )}
                    <li>
                        <div className="text-center text-muted">
                            <i className="bi bi-chevron-bar-down fs-1"></i>
                            <p>已經在最底了</p>
                        </div>
                    </li>
                </ul>)
        } else {
            return (
                <div className="text-center text-muted pt-5">
                    <i className="bi bi-slash-circle fs-1"></i>
                    <p>自訂代理規則已停用</p>
                </div>
            );
        }
    }, [mode, whitelist, blacklist, onDelete]);

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
                                    onClick={async () => await onProxyModeChange('whitelist')}>白名單模式</Button>
                            <Button variant={mode === "disable" ? "secondary" : "outline-secondary"}
                                    onClick={async () => await onProxyModeChange('disable')}>禁用</Button>
                            <Button variant={mode === "blacklist" ? "primary" : "outline-primary"}
                                    className={"rounded-end-5"}
                                    onClick={async () => await onProxyModeChange('blacklist')}>黑名單模式</Button>
                        </ButtonGroup>
                    </Col>
                    <Col className="position-relative">
                        <div className={'list'}
                             style={{'--mask-top': maskTop, '--mask-bottom': maskBottom} as CSSProperties}>
                            <Scrollbar style={{height: '100%'}} onUpdate={onScroll}>
                                {list}
                            </Scrollbar>
                        </div>
                    </Col>
                    <Col xs={'auto'}>
                        <Button variant="primary" className="w-100 rounded-5" onClick={onAdd}><i
                            className="bi bi-plus-lg me-2"></i>添加目前網站</Button>
                    </Col>
                </Row>
            </div>
            <AddURLModal show={show} onHide={() => setShow(false)} url={activeURL}/>
        </>
    );
}

/**
 * URLSelector component
 *
 * This component allows users to select parts of a URL by clicking on them.
 * It highlights the parts of the URL based on hover and selection states.
 *
 * @param {URLSelectorProps} props - The properties for the URLSelector component.
 * @param {string} props.value - The URL value to be displayed and interacted with.
 * @param {function} props.onSelect - Callback function to handle the selection of a URL part.
 * @param {function} [props.onHover] - Optional callback function to handle hovering over a URL part.
 */
const URLSelector: React.FC<URLSelectorProps> = ({value, onSelect, onHover}) => {

    const [selectedIndex, setSelectedIndex] = useState<number>(-1) //selected index
    const [hoverIndex, setHoverIndex] = useState<number>(-1) //hovered index
    const [url, setURL] = useState(new URL(value)) //url object

    /**
     * Callback function to handle clicking on a part of the URL
     */
    const onClick = useCallback((index: number) => {
        setSelectedIndex(index)
        setHoverIndex(index)
        onSelect(url.host.split('.').slice(index).join('.'))
    }, [url, onSelect])

    /**
     * Callback function to handle mouse hovering on a part of the URL
     */
    const onMouseEnter = useCallback((index: number) => {
        setHoverIndex(index)
        onHover && onHover(url.host.split('.').slice(index).join('.'))
    }, [onHover, url])

    /**
     * Callback function to handle mouse leaving a part of the URL
     */
    const onMouseLeave = useCallback(() => {
        setHoverIndex(selectedIndex)
        onHover && onHover(null)
    }, [selectedIndex, onHover])

    /**
     * Nested HTML component to display the URL parts with a glow effect
     * based on the hovered index.
     */
    const nestedHTML = useMemo(() => {
        //split the host into parts
        const host = url.host.split('.');
        //join last 2 parts of the host to make it a single part
        host.splice(host.length - 2, 2, host.slice(-2).join('.'))

        return (
            <>
                {host.map((part, index) => {
                    const color = hoverIndex <= index ? COLORS_LIST[(hoverIndex < 0 ? index : hoverIndex) % COLORS_LIST.length] : 'inherit'

                    return (
                        <span key={index}
                              onClick={() => onClick(index)}
                              onMouseEnter={() => onMouseEnter(index)}
                              onMouseLeave={onMouseLeave}
                              style={{color}}>
                            {part}{index < host.length - 1 ? '.' : ''}
                        </span>
                    )
                })}
            </>
        )
    }, [url, onMouseEnter, onMouseLeave, hoverIndex, onClick])

    useEffect(() => {
        setURL(new URL(value))
    }, [value]);

    return (
        <DynamicText defaultFontSize="1.5em"><span style={{cursor: "pointer"}}>{nestedHTML}</span></DynamicText>
    )
}

/**
 * AddURLModal component
 *
 * This component provides a modal dialog for adding URLs to either a whitelist or a blacklist.
 *
 * @param {AddURLModalProps} props - The properties for the AddURLModal component.
 * @param {boolean} props.show - Determines whether the modal is visible.
 * @param {function} props.onHide - Callback function to hide the modal.
 * @param {string} props.url - The URL to be added to the list.
 */
const AddURLModal: React.FC<AddURLModalProps> = ({show, onHide, url}) => {

    const [addListType, setAddListType] = useState<Exclude<ProxyMode, 'disable'>>("whitelist")
    const [selectedURL, setSelectedURL] = useState<string | null>(null)
    const [demoURL, setDemoURL] = useState<string | null>(null)
    const [thisHostOnly, setThisHostOnly] = useState<boolean>(false)

    /**
     * Callback function to handle adding a URL to the blacklist.
     */
    const onAdd = useCallback(async () => {
        //check if chrome.storage is available
        if (chrome.storage === undefined) return;

        //get the list from chrome.storage.sync
        const data = await chrome.storage.sync.get<StorageLists>(addListType);
        const list: string[] = data[addListType] ?? []

        //add the selected url and its wildcard version to the list
        if (selectedURL && !list.includes(selectedURL)) list.push(selectedURL)
        if (!thisHostOnly && !list.includes('*.' + selectedURL)) list.push('*.' + selectedURL)

        //add the selected url to the list
        await chrome.storage.sync.set({[addListType]: list})
        console.log(`${selectedURL} added to ${addListType}`)

        onHide();
    }, [selectedURL, addListType, onHide, thisHostOnly]);

    /**
     * Callback function to handle the change in the "Only this host" checkbox.
     */
    const onThisHostOnlyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        console.debug(e.target.checked)
        setThisHostOnly(e.target.checked)
    }, [])

    /**
     * Memoized component to display the URLs that pass the condition.
     */
    const pass = useMemo(() => {
        const host = (demoURL ?? selectedURL)?.split('.');

        if (!host) return null;
        return (
            <ul>
                <li>{host.join('.')}</li>
                {!thisHostOnly ? <>
                    <li>example.{host.join('.')}</li>
                    <li>*.{host.join('.')}</li>
                </> : null}
            </ul>
        )
    }, [selectedURL, thisHostOnly, demoURL])

    /**
     * Memoized component to display the URLs that do not pass the condition.
     */
    const reject = useMemo(() => {
        //split the host into parts
        const host = (demoURL ?? selectedURL)?.split('.');

        if (!host) return null;
        return (
            <ul>
                {thisHostOnly ? <>
                    <li>example.{host.join('.')}</li>
                    <li>*.{host.join('.')}</li>
                </> : null}
                {host.length > 2 ? <li>{host.slice(1).join('.')}</li> : null}
                {host.length > 1 ? <li>example.{host.slice(1).join('.')}</li> : null}
            </ul>
        )
    }, [selectedURL, thisHostOnly, demoURL])

    useEffect(() => {
        setSelectedURL(null)
        setDemoURL(null)
    }, [show]);

    return (
        <Modal show={show} fullscreen onHide={onHide}>
            <Modal.Header closeButton>
                <Modal.Title>添加網站</Modal.Title>
            </Modal.Header>
            <Modal.Body className="overflow-y-scroll">
                <Row className="gy-2 justify-content-center">
                    <Col xs={'auto'}>
                        <ButtonGroup>
                            <Button variant={addListType === "whitelist" ? "primary" : "outline-primary"}
                                    onClick={() => setAddListType('whitelist')}
                                    className="rounded-start-5">添加到白名單</Button>
                            <Button variant={addListType === "blacklist" ? "primary" : "outline-primary"}
                                    onClick={() => setAddListType('blacklist')}
                                    className="rounded-end-5">添加到黑名單</Button>
                        </ButtonGroup>
                    </Col>
                    <Col xs={12}>
                        <div>請選擇網站網域範圍</div>
                        <URLSelector value={url} onSelect={(value) => setSelectedURL(value)}
                                     onHover={(value) => setDemoURL(value)}/>
                    </Col>
                    <Col/>
                    <Col xs={'auto'}>
                        <Form.Check type="checkbox" label="只針對此網域" id="thisHostOnly"
                                    onChange={onThisHostOnlyChange} checked={thisHostOnly}/>
                    </Col>
                    <Col xs={12}>
                        <Row>
                            <Col className="text-success-emphasis">
                                <p>以下網站<span className="fst-italic fs-5 fw-bold">符合</span>條件:</p>
                                {pass}
                            </Col>
                            <Col className="text-danger-emphasis">
                                <p>以下網站<span className="fst-italic fs-5 fw-bold">不符合</span>條件:</p>
                                {reject}
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="primary" onClick={onAdd} className="rounded-5"
                        disabled={selectedURL === null}>添加到名單</Button>
            </Modal.Footer>
        </Modal>
    )
}

export default BlackWhiteList;
