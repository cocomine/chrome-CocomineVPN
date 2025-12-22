import React, {PropsWithChildren, useEffect, useRef} from 'react';
import './DynamicText.css';

/**
 * Interface for the properties of the DynamicText component.
 *
 * @interface DynamicTextProps
 * @extends {PropsWithChildren}
 * @property {string} [defaultFontSize] - The default font size for the text.
 */
interface DynamicTextProps extends PropsWithChildren {
    defaultFontSize?: string;
}

/**
 * DynamicText component
 *
 * This component dynamically adjusts the font size of its text content to fit within its container.
 *
 * @param {DynamicTextProps} props - The properties for the DynamicText component.
 * @param {string} [props.defaultFontSize] - The default font size for the text.
 * @param {React.ReactNode} props.children - The text content to be displayed.
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