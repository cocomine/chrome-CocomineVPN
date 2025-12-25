import React, {useEffect, useRef} from 'react';
import './DynamicText.css';
import {DynamicTextProps} from "../extension/types";


/**
 * DynamicText component
 *
 * This component dynamically adjusts the font size of its text content to fit within its container.
 *
 * @param defaultFontSize - The default font size for the text.
 * @param children
 */
const DynamicText: React.FC<DynamicTextProps> = ({defaultFontSize, children}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLHeadingElement>(null);

    useEffect(() => {
        const adjustFontSize = () => {
            if (containerRef.current && textRef.current) {
                const containerWidth = containerRef.current.offsetWidth;
                const textWidth = textRef.current.offsetWidth;
                const fontSize = parseInt(window.getComputedStyle(textRef.current).fontSize, 10);

                if (textWidth > containerWidth) {
                    textRef.current.style.fontSize = `${fontSize * (containerWidth / textWidth)}px`;
                } else {
                    textRef.current.style.fontSize = defaultFontSize || 'inherit';
                }
            }
        };

        adjustFontSize();
        window.addEventListener('resize', adjustFontSize);
        return () => window.removeEventListener('resize', adjustFontSize);
    }, [defaultFontSize]);

    return (
        <div className="dynamic-text-container" ref={containerRef}>
            <span className="dynamic-text" ref={textRef}>{children}</span>
        </div>
    );
};

export default DynamicText;