import React, {useEffect, useState} from "react";
import moment from "moment/moment";
import {Button, Col, Placeholder, Row} from "react-bootstrap";
import {VMInstanceDataType} from "../extension/types";

/**
 * TimeLast component
 *
 * This component displays the remaining time until a node is expected to go offline.
 * It also provides a button to extend the node's uptime if the remaining time is less than one hour.
 *
 * @param vmData - The data object containing information about the VM.
 */
export const TimeLast: React.FC<{ vmData: VMInstanceDataType }> = ({vmData}) => {
    const [expect_offline_time_Interval, setExpect_offline_time_Interval] = useState<string | null>(null)
    const [enableExtend, setEnableExtend] = useState<boolean>(false)
    const [expired, setExpired] = useState<string | null>(vmData._expired)

    // update expect_offline_time_Interval every second
    useEffect(() => {
        if (expired !== null) {
            const id = setInterval(() => {
                const expect_offline_time = moment(expired)
                const diff = expect_offline_time.diff(Date.now())
                const tmp = moment.utc(diff).format('HH:mm:ss')

                if (diff < 60 * 60 * 1000) setEnableExtend(true)
                setExpect_offline_time_Interval(diff > 0 ? tmp : "節點已關閉");
            }, 1000)

            return () => clearInterval(id)
        } else {
            setExpect_offline_time_Interval("節點已關閉")
        }
    }, [expired]);

    useEffect(() => {
        setExpired(vmData._expired)
    }, [vmData]);

    return (
        <div className="section glow">
            <Row className="justify-content-center align-content-center">
                <Col xs={'auto'}>
                    <span className={'text-muted'}>距離節點預計離線</span>
                </Col>
                <div className="w-100"></div>
                <Col xs={12} className={'text-center'}>
                    {expect_offline_time_Interval ? (
                        <h3>{expect_offline_time_Interval}</h3>
                    ) : (
                        <Placeholder animation="wave" as={'h3'}>
                            <Placeholder xs={6} className={'rounded'}/>
                        </Placeholder>
                    )}
                </Col>
                <Col xs={12}>
                    <Button variant={enableExtend ? "primary" : "outline-primary"}
                            className="w-100 rounded-5" href={"https://vpn.cocomine.cc/" + vmData._id + "#extendTime"} target="_blank"
                            disabled={!enableExtend}>
                        {enableExtend ? "延長開放時間" : "離線前一小時可以延長開放時間"}
                    </Button>
                </Col>
            </Row>
        </div>
    )
}
