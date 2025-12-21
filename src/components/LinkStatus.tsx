import React, {useCallback, useEffect, useMemo, useState} from "react";
import tw_flag from "../assets/tw.svg";
import jp_flag from "../assets/jp.svg";
import us_flag from "../assets/us.svg";
import hk_flag from "../assets/hk.svg";
import uk_flag from "../assets/uk.svg";
import in_flag from "../assets/in.svg";
import dislink from "../assets/dislink.svg";
import link from "../assets/link.svg";
import {Col, Row} from "react-bootstrap";
import {VMCountryType} from "../extension/types";


/**
 * LinkStatus component
 *
 * This component displays the connection status to a specific country node.
 * It shows a flag representing the country and a message indicating the connection status.
 *
 * @param {Object} props - The properties for the LinkStatus component.
 * @param {boolean} props.connectedProp - Indicates if the connection is active.
 * @param {VMCountryType | null} props.countryProp - The country code of the connected node.
 * @param {string | null} props.vmName - The name of the virtual machine.
 * @param {function} props.onDisconnect - Callback function to handle disconnection.
 */
export const LinkStatus: React.FC<{
    connectedProp: boolean,
    countryProp: VMCountryType | null,
    vmName: string | null,
    onDisconnect: () => void
}> = ({connectedProp, countryProp, vmName, onDisconnect}) => {
    const [connected, setConnected] = useState(connectedProp);
    const [country, setCountry] = useState<VMCountryType | null>(countryProp);
    const [msg, setMsg] = useState<string | null>('未連線');

    // flag image element for menu item (memoized) (only update when data._country is changed)
    const flag = useMemo(() => {
        switch (country) {
            case "TW":
                return <img src={tw_flag} alt="TW Flag" className="flag fit-left" draggable={false}/>;
            case "JP":
                return <img src={jp_flag} alt="JP Flag" className="flag" draggable={false}/>;
            case "US":
                return <img src={us_flag} alt="JP Flag" className="flag fit-left" draggable={false}/>;
            case "HK":
                return <img src={hk_flag} alt="HK Flag" className="flag" draggable={false}/>;
            case "UK":
                return <img src={uk_flag} alt="UK Flag" className="flag" draggable={false}/>;
            case "IN":
                return <img src={in_flag} alt="IN Flag" className="flag" draggable={false}/>;
            case null:
                return <img src={dislink} alt="Disconnect" className="flag"
                            style={{padding: "1.5rem", overflow: 'visible'}} draggable={false}/>;
            default:
                return <img src={link} alt="Connected" className="flag" draggable={false}/>;
        }
    }, [country]);

    // toggle mouse enter event
    const onMouseEnter = useCallback(() => {
        setMsg(connected ? "點擊以斷開" : "點擊以開啟網頁")
    }, [connected]);

    // toggle mouse leave event
    const onMouseLeave = useCallback(() => {
        setMsg(connected ? `已連接${country}(${vmName})節點` : "未連線")
    }, [connected, country, vmName]);

    // update state when props changed
    useEffect(() => {
        setCountry(countryProp)
        setConnected(connectedProp)
        setMsg(connectedProp ? (countryProp === null ? "連線中" : `已連接${countryProp}(${vmName})節點`) : "未連線")
    }, [connectedProp, countryProp, vmName]);

    return (
        <div className="section glow">
            {connected && <div className="particles">
                {Array.from({length: 20}).map((_, i) => (
                    <div key={i} className="particle"></div>
                ))}
            </div>}
            <Row className="justify-content-center align-content-center g-1">
                <Col xs={'auto'}>
                    <div className="link-status" data-connected={connected} onClick={onDisconnect}
                         onMouseEnter={onMouseEnter}
                         onMouseLeave={onMouseLeave}>
                        {flag}
                    </div>
                </Col>
                <div className="w-100"></div>
                <Col xs={'auto'}>
                    <h3>{msg}</h3>
                </Col>
            </Row>
        </div>
    )
}