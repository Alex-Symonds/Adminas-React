/*
    CSS Animation Helper
    Give it the element to animate, the CSS class and, optionally, a function to run afterwards.
    It will handle adding/removing the class and running the function.
*/
export function animateAndThen(animatedDOMElement, cssAnimationClass, f_after = null){
    if(animatedDOMElement){
        animatedDOMElement.classList.add(cssAnimationClass);

        animatedDOMElement.onanimationend = () => {
            animatedDOMElement.classList.remove(cssAnimationClass);
            if(f_after){
                f_after();
            }
        };
    }
}