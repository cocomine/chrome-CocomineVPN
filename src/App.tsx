import {Button, Col, Row} from "react-bootstrap";
import React, {useCallback, useEffect, useMemo, useState} from "react";
import moment from "moment";
import tw_flag from "./assets/tw.svg";
import jp_flag from "./assets/jp.svg";
import us_flag from "./assets/us.svg";
import hk_flag from "./assets/hk.svg";
import uk_flag from "./assets/uk.svg";
import dislink from "./assets/dislink.svg";
import {APP_VERSION} from "./index";

type countryType = "TW" | "JP" | "US" | "HK" | "UK" | string

function App() {


    return (
        <>
            <div id="App">
                <Row className="justify-content-center align-content-center">
                    <Col xs={12}>
                        <LinkStatus/>
                    </Col>
                </Row>
            </div>
            <TimeLast/>
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
    );
}

const LinkStatus: React.FC<{}> = () => {
    const [connected, setConnected] = useState(false);
    const [country, setCountry] = useState<countryType | null>(null);
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
            default:
                return <img src={dislink} alt="Disconnect" className="flag"
                            style={{padding: "1.5rem", overflow: 'visible'}} draggable={false}/>;
        }
    }, [country]);

    // toggle click event
    const onClick = useCallback(() => {
        if (connected) {
            // disconnect
            chrome.proxy && chrome.proxy.settings.clear({}, () => {
                setConnected(false);
                setCountry(null);
                setMsg("未連線")
            });
        } else {
            // open vpn.cocomine.cc
            window.open('https://vpn.cocomine.cc', '_blank')
            return
        }
    }, [connected]);

    // toggle mouse enter event
    const onMouseEnter = useCallback(() => {
        if (connected) {
            setMsg("點擊以斷開")
        } else {
            setMsg("點擊以開啟網頁")
        }
    }, [connected]);

    // toggle mouse leave event
    const onMouseLeave = useCallback(() => {
        if (connected) {
            setMsg("已連接" + country + "節點")
        } else {
            setMsg("未連線")
        }
    }, [connected, country]);

    // get current proxy status
    useEffect(() => {
        getProxyData().then(({connected, country}) => {
            setConnected(connected)
            setCountry(country)
            setMsg(connected ? "已連接" + country + "節點" : "未連線")
        }).catch(() => {
            setConnected(false)
            setCountry(null)
            setMsg("未連線")
        })
    }, []);


    return (
        <Row className="justify-content-center align-content-center g-1">
            <Col xs={'auto'}>
                <div className="link-status" data-connected={connected} onClick={onClick} onMouseEnter={onMouseEnter}
                     onMouseLeave={onMouseLeave}>
                    {flag}
                </div>
            </Col>
            <div className="w-100"></div>
            <Col xs={'auto'}>
                <h3>{msg}</h3>
            </Col>
        </Row>
    )
}

const TimeLast: React.FC<{}> = () => {
    const [expect_offline_time_Interval, setExpect_offline_time_Interval] = useState<string>("Loading...")
    const [expired, setExpired] = useState<string | null>(null)

    // get node expired time
    useEffect(() => {
        chrome.storage && chrome.storage.local.get('vmData', (data) => {
            console.debug(data) //debug
            setExpired(data.vmData._expired)
        });
    }, []);

    // update expect_offline_time_Interval every second
    useEffect(() => {
        if (expired !== null) {
            const id = setInterval(() => {
                const expect_offline_time = moment(expired)
                const diff = expect_offline_time.diff(Date.now())
                const tmp = moment.utc(diff).format('HH:mm:ss')

                setExpect_offline_time_Interval(diff > 0 ? tmp : "節點已關閉");
            }, 1000)

            return () => clearInterval(id)
        }
    }, [expired]);

    if (expired === null) return null
    return (
        <div id="App">
            <Row className="justify-content-center align-content-center">
                <Col xs={'auto'}>
                    <span>距離節點預計離線</span>
                </Col>
                <div className="w-100"></div>
                <Col xs={'auto'}>
                    <h5>{expect_offline_time_Interval}</h5>
                </Col>
            </Row>
        </div>
    )
}

function getProxyData() {
    return new Promise<{ connected: boolean, country: countryType | null }>((resolve, reject) => {
        // Check if chrome.proxy is available
        if (chrome.proxy === undefined) return reject("chrome.proxy not found")

        // Get the current proxy settings
        chrome.proxy.settings.get({}, (config) => {
            const value = config.value
            console.debug(value) //debug

            // Check if connected to vpn.cocomine.cc
            if (value.mode === 'fixed_servers' && value.rules.singleProxy && value.rules.singleProxy.host.match(/^(.*)(vpn\.cocomine\.cc)$/)) {
                // Get country code
                const rexArray = /^(.*)(.{2})(\.vpn\.cocomine\.cc)$/.exec(value.rules.singleProxy.host)
                const country = rexArray && rexArray[2].toUpperCase()

                // Resolve the promise with the connection status and country code
                resolve({connected: true, country: country})
            } else {
                // Resolve the promise with the connection status as false and country as null
                resolve({connected: false, country: null})
            }
        });
    })
}

export default App;
