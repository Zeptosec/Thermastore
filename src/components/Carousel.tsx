import { useEffect, useRef, useState } from "react";
import { convertTypeAcquisitionFromJson } from "typescript";

export default function Carousel({ children }: any) {
    const elem = useRef<HTMLDivElement>(null);
    const [moved, setMoved] = useState(false);
    const [moveTo, setMoveTo] = useState({ currPos: 0, cnt: 0 });
    let moving = false;
    function animate(from: number, to: number, timing: (timeFraction: number) => number, duration: number) {
        let start = performance.now();
        let cnt = moveTo.cnt;
        let diff = to - from;

        requestAnimationFrame(function animate(time) {
            // timeFraction goes from 0 to 1
            let timeFraction = (time - start) / duration;
            if (timeFraction > 1) timeFraction = 1;
            if (timeFraction < 1 && cnt === moveTo.cnt && !moving) {
                // calculate the current animation state
                let progress = timing(timeFraction);
                if (elem.current) {
                    elem.current.scrollLeft = from + diff * progress;
                    requestAnimationFrame(animate);
                }
            }
        });
    }

    let pos = { top: 0, left: 0, x: 0, y: 0 };
    function mouseMoveHandler(w: MouseEvent | Touch) {
        // How far the mouse has been moved
        const dx = w.clientX - pos.x;
        const dy = w.clientY - pos.y;
        if (Math.abs(dx) + Math.abs(dy) > 5) {
            moving = true;
            if (elem.current) {
                elem.current.style.userSelect = 'none';
                elem.current.style.cursor = 'grabbing';
            }
            if (window.getSelection) {
                window.getSelection()?.removeAllRanges();
            }
        }

        if (!elem.current) return;
        // Scroll the element
        elem.current.scrollTop = pos.top - dy;
        elem.current.scrollLeft = pos.left - dx;
    }

    function UpHandler() {
        if (elem.current) {
            const maxScrollLeft = elem.current.scrollWidth - elem.current.clientWidth
            const currX = elem.current.scrollLeft;
            let sum = 0;
            for (let i = 0; i < elem.current.childElementCount; i++) {
                const width = elem.current.children[i].clientWidth;
                const endPoint = sum + width + 16;
                if (maxScrollLeft === currX) {
                    sum = maxScrollLeft;
                } else if (currX >= sum && currX <= endPoint) {
                    const pointXOnChild = currX - sum;
                    if (pointXOnChild >= width / 2)
                        sum = endPoint;
                    animate(currX, sum, (num: number) => {
                        return 1 - Math.pow(1 - num, 5);
                    }, 600);
                    //elem.current.scrollLeft = sum;
                } else {
                    sum = endPoint;
                }
            }
        }
        moving = false;
        if (elem.current) {
            elem.current.style.userSelect = 'auto';
            elem.current.style.cursor = 'grab';
        }
    }

    function mouseUpHandler(w: MouseEvent) {
        UpHandler();
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    }

    function DownHandler(x: number, y: number) {
        if (!elem.current) return;
        // Initialize position
        pos = {
            left: elem.current.scrollLeft,
            top: elem.current.scrollTop,
            x,
            y
        };

    }

    function mouseDownHandler(w: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        DownHandler(w.clientX, w.clientY);

        // adding mousemove and up event listeners
        document.addEventListener('mousemove', mouseMoveHandler);
        document.addEventListener('mouseup', mouseUpHandler);
    }

    let touchingTouch: React.Touch | null = null;
    function touchMoveHandler(w: TouchEvent) {
        mouseMoveHandler(w.targetTouches[0]);
    }

    function touchUpHandler(w: TouchEvent) {
        for (let i = 0; i < w.targetTouches.length; i++) {
            if (w.targetTouches[i].identifier === touchingTouch?.identifier) {
                return;
            }
        }
        UpHandler();
        document.removeEventListener('touchmove', touchMoveHandler);
        document.removeEventListener('touchend', touchUpHandler);
    }

    function touchDownHandler(w: React.TouchEvent<HTMLDivElement>) {
        touchingTouch = w.targetTouches[0];
        DownHandler(w.targetTouches[0].clientX, w.targetTouches[0].clientY);

        // adding touchmove and up event listeners
        document.addEventListener('touchmove', touchMoveHandler);
        document.addEventListener('touchend', touchUpHandler);
    }

    useEffect(() => {
        // removing possibly active event listeners

        return () => {
            document.removeEventListener('touchmove', touchMoveHandler);
            document.removeEventListener('touchend', touchUpHandler);
            document.removeEventListener('mousemove', mouseMoveHandler);
            document.removeEventListener('mouseup', mouseUpHandler);
        }
    }, [])

    return <div ref={elem}
        onMouseDown={mouseDownHandler}
        style={{ cursor: 'grab' }}
        onTouchStart={touchDownHandler}
        className={`flex touch-none flex-nowrap gap-4 overflow-hidden ${moved ? 'select-none cursor-grabbing' : 'cursor-default'}`}>
        {children}
    </div>
}