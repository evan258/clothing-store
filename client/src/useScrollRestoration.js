export const useScrollRestoration = (location, navType) => {
    if (navType !== "POP") {
        console.log("push");
        window.scrollTo({
            top: 0,
            behavior: "instant"
        });
        return;
    }

    const savedY = sessionStorage.getItem(`scrollY${location.pathname}${location.search}`);
    if (savedY) {
        let timerId;
        const intervalId = setInterval(() => {
            const pageHeight = document.documentElement.scrollHeight;
            const targetY = parseInt(savedY, 10);
            const imagesLoaded = Array.from(document.images).every(img => img.complete);
            if (pageHeight > targetY && imagesLoaded) {
                window.scrollTo({
                    top: targetY,
                    behavior: "instant"
                });
                clearInterval(intervalId);
                clearTimeout(timerId);
                return;
            }
        }, 50);
        timerId = setTimeout(() => {
            clearInterval(intervalId);
        }, 5000);
    }
}
