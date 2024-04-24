import {Button, Col, Row} from "react-bootstrap";
import React, {useEffect, useMemo, useState} from "react";
import moment from "moment";
import tw_flag from "./assets/tw.svg";
import jp_flag from "./assets/jp.svg";
import us_flag from "./assets/us.svg";
import hk_flag from "./assets/hk.svg";
import uk_flag from "./assets/uk.svg";
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
                    <Col xs={12}>
                        <TimeLast/>
                    </Col>
                </Row>
            </div>
            <Row className="justify-content-between" style={{fontSize: "0.8em"}}>
                <Col xs="auto">
                            <span>Build by © {moment().format("yyyy")} <a
                                href="https://github.com/cocomine" target="_blank"
                                rel="noopener noreferrer">cocomine</a>.</span>
                    <br/>
                    <span className="text-muted">{APP_VERSION}</span>
                </Col>
                <Col xs="auto">
                    <Button variant="link" href="https://github.com/cocomine/cocomine_vpnapi_ui" target="_blank"
                            rel="noopener noreferrer">
                        <i className="bi bi-github me-2"></i>
                    </Button>
                </Col>
            </Row>
        </>
    );
}

const LinkStatus: React.FC<{}> = () => {
    const [connected, setConnected] = useState(true);
    const [country, setCountry] = useState<countryType | null>("HK");

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
                return <svg xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 640 512">
                    <path fill={"currentColor"}
                          d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L489.3 358.2l90.5-90.5c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114l-96 96-31.9-25C430.9 239.6 420.1 175.1 377 132c-52.2-52.3-134.5-56.2-191.3-11.7L38.8 5.1zM239 162c30.1-14.9 67.7-9.9 92.8 15.3c20 20 27.5 48.3 21.7 74.5L239 162zM116.6 187.9L60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5l61.8-61.8-50.6-39.9zM220.9 270c-2.1 39.8 12.2 80.1 42.2 110c38.9 38.9 94.4 51 143.6 36.3L220.9 270z"/>
                </svg>;
        }
    }, [country]);

    // get current proxy status
    useEffect(() => {
        chrome.proxy && chrome.proxy.settings.get({}, (config) => {
            const value = config.value
            // check if connected to vpn.cocomine.cc
            if (value.mode === 'fixed_servers' && value.rules.singleProxy.host.match(/^(.*)(vpn\.cocomine\.cc)$/)) {
                // get country code
                const rexArray = /^(.*)(.{2})(\.vpn\.cocomine\.cc)$/.exec(value.rules.singleProxy.host)
                const country = rexArray && rexArray[2].toUpperCase()
                setCountry(country)
                setConnected(true);
            }
        });
    }, []);

    return (
        <Row className="justify-content-center align-content-center g-1">
            <Col xs={'auto'}>
                <div className="link-status" data-connected={connected}>
                    {flag}
                </div>
            </Col>
            <div className="w-100"></div>
            <Col xs={'auto'}>
                <h3>{connected ? "已連接" + country + "節點" : "未連線"}</h3>
            </Col>
        </Row>
    )
}

const TimeLast: React.FC<{}> = () => {
    const [expect_offline_time_Interval, setExpect_offline_time_Interval] = useState<string>("Loading...")
    const [expired, setExpired] = useState<string | null>(null)

    useEffect(() => {
        chrome.storage && chrome.storage.local.get('expired', (data) => {
            setExpired(data.expired)
        });
    }, []);

    // update expect_offline_time_Interval every second
    useEffect(() => {
        if (expired !== null) {
            const id = setInterval(() => {
                const expect_offline_time = moment(expired)
                const diff = expect_offline_time.diff(Date.now())
                const tmp = moment.utc(diff).format('HH:mm:ss')

                setExpect_offline_time_Interval(diff > 0 ? tmp : "00:00:00");
            }, 1000)

            return () => clearInterval(id)
        }
    }, [expired]);

    return (
        <Row className="justify-content-center align-content-center">
            <hr/>
            <Col xs={'auto'}>
                <span>距離預計離線</span>
            </Col>
            <div className="w-100"></div>
            <Col xs={'auto'}>
                <h5>{expect_offline_time_Interval}</h5>
            </Col>
        </Row>
    )
}

export default App;
