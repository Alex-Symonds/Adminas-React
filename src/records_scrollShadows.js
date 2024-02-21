/*
    Add a shadow effect to the sides of a horizontally scrolling frame, where 
    the opacity of each shadow is proportional to the scrolling position,
    with left shadow based on distance from 0% and right shadow from 100%.

    Usage:
        > Parent element (to set the visible area)
            >> Has class "scrollingWrapper"
            >> Has CSS variables: --opacityStart, --opacityEnd
        > Child element 
            >> Has class "scrollingWrapper_scrollable"
            >> Has overflow-x set to auto or scroll

    Contents:
        || CSS class and variable names
        || Main
        || Main Functions
        || Helper Functions
        || Finder Functions
*/

document.addEventListener('DOMContentLoaded', () => {
    // || CSS class and variable names, in one convenient spot
    const CSS_CLASS_SCROLL_WRAPPER = 'scrollingShadowsWrapper';
    const CSS_CLASS_SCROLLABLE = 'scrollingShadowsWrapper_scrollable';
    const CSS_VAR_OPACITY_START = '--opacityStart';
    const CSS_VAR_OPACITY_END = '--opacityEnd';


    // || Main
    let scrollShadowsEnabled = false;
    handleScrollShadows();
    window.addEventListener('resize', () => {
        handleScrollShadows();
    });


    // || Main Functions
    function handleScrollShadows(){
        const scrollingWanted = needsScrolling();
        if(scrollingWanted && !scrollShadowsEnabled){
            setupScrollShadows();
        } else if(!scrollingWanted && scrollShadowsEnabled){
            removeScrollShadows();
        }
    }


    function setupScrollShadows(){
        const scrollable = findScrollable();
        if(scrollable !== null){
            updateOpacityOnScroll();
            scrollable.addEventListener('scroll', () => {
                updateOpacityOnScroll();
            });
            scrollShadowsEnabled = true;
        }
    }


    function removeScrollShadows(){
        setScrollOpacity(0, 0);

        const scrollable = findScrollable();
        if(scrollable !== null){
            scrollable.removeEventListener('scroll', () => {
                updateOpacityOnScroll();
            });
        }

        // By this point, it's either disabled by the above or 
        // disabled because the element doesn't exist
        scrollShadowsEnabled = false;
    }


    // || Helper Functions
    function calculateContentScrollWidth(scrollable){
        const scrollWrapper = findScrollWrapper();
        if(scrollable !== null && scrollWrapper !== null){
            return scrollable.scrollWidth - scrollWrapper.offsetWidth;
        }
        return 0;
    }


    function needsScrolling(){
        const scrollable = findScrollable();
        if(scrollable === null){
            return false;
        }
        return scrollable.scrollWidth > scrollable.clientWidth;
    }


    function setScrollOpacity(start, end){
        const scrollWrapper = findScrollWrapper();
        if(scrollWrapper !== null){
            scrollWrapper.style.setProperty(CSS_VAR_OPACITY_START, start);
            scrollWrapper.style.setProperty(CSS_VAR_OPACITY_END, end);
        }
    }


    function updateOpacityOnScroll(){
        // This is used in an event listener, so it mustn't have arguments
        const scrollable = findScrollable();
        const contentScrollWidth = calculateContentScrollWidth(scrollable);
        if(contentScrollWidth !== 0){
            const currentScroll = scrollable.scrollLeft / contentScrollWidth;
            setScrollOpacity(currentScroll, 1 - currentScroll);
        }
    }


    // || Finder Functions
    function findScrollWrapper(){
        return document.querySelector(`.${CSS_CLASS_SCROLL_WRAPPER}`);
    }


    function findScrollable(){
        return document.querySelector(`.${CSS_CLASS_SCROLLABLE}`);
    }
});





