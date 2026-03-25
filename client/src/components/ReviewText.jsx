import { useLayoutEffect, useRef, useState } from "react"


const ReviewText = ({text, flag = false}) => {
    const [expanded, setExpanded] = useState(false);
    const [toggleNeeded, setToggleNeeded] = useState(false);
    const textRef = useRef(null);

    useLayoutEffect(() => {
        if (textRef.current) {
            const truncated = textRef.current.scrollHeight > textRef.current.clientHeight;
            setToggleNeeded(truncated);
        }
    }, [text]);

    return (
        <div>
            <p 
                ref={textRef} 
                className={
                    `relative whitespace-pre-wrap wrap-break-word text-[rgb(0,0,0,0.6)] ${expanded ? "line-clamp-none" : flag ? "line-clamp-6 lg:line-clamp-5" : "line-clamp-4 lg:line-clamp-3"} 
                    ${(!expanded && toggleNeeded) ? "after_line" : ""}`
                }
            >
                {text}
            </p>
            {toggleNeeded && (
                <>
                    <button 
                        onClick={() => setExpanded(!expanded)}
                        className="text-gray-400 font-medium text-[12px] lg:text-[14px] xl:text-[16px] leading-5"
                    >
                        {expanded? "See less": "Read more"}
                    </button>
                </>
            )}
        </div>
    )
}

export default ReviewText;
