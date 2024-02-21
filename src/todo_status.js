/*
    Todo list contains a strip of status icon "toggletips".
    
    Toggle tip bubbles are opened by:
        > Clicking a status icon (even if a different bubble is already open)
        > Tapping a status icon
        > Enter key while a status icon is focused
    
    Toggle tip bubbles are closed by:
        > Clicking outside the bubble (including a different status icon)
        > Tapping outside the bubble
        > Escape while the relevant status icon is focused
*/

function closeOnClickOutside(e, target_element, closeFunction){
    let clickWasInside = e.composedPath().includes(target_element);
    if(!clickWasInside) closeFunction();
}

document.addEventListener('DOMContentLoaded', () => {
    const CLASS_STATUS_ELE = "statusEle";
    const CLASS_STATUS_ELE_MESSAGE = "statusEle_message";
    const CLASS_STATUS_ELE_HIDDEN = "statusEle_message-hidden";
    const CLASS_STATUS_ELE_BUTTON = "statusEle_icon";

    // If JavaScript is disabled, they should all be "on"
    hide_all_toggletips();

    // Add controls to every status ele button
    document.querySelectorAll(`.${CLASS_STATUS_ELE_BUTTON}`).forEach(ele => {
        ele.addEventListener('click', (e) => open(e));
        ele.addEventListener('keydown', (e) => handle_keydown(e));
        ele.addEventListener('blur', (e) => close(e));
    });


    function handle_keydown(e){
        if((e.keyCode || e.which) === 27) {
            close(e);
        }
        if((e.keyCode || e.which) === 13){
            open(e);
        }
    }


    function isDisplayed(messageEle){
        return !messageEle.classList.contains(CLASS_STATUS_ELE_HIDDEN);
    }
    

    function open(e){
        const statusEle = find_ele_statusEle(e);
        const messageEle = find_ele_statusEle_message(statusEle);
        if(!isDisplayed(messageEle)){
            window.setTimeout(() => {
                hide_all_toggletips();
                show_one_toggletip(messageEle, statusEle);
                add_closeOnClickOutside(messageEle, statusEle);
            }, 100);
        }
    }


    function close(e){
        const statusEle = find_ele_statusEle(e);
        const messageEle = find_ele_statusEle_message(statusEle);
        if(isDisplayed(messageEle)){
            hide_one_tooltip(messageEle);
        }
    }
    

    function hide_all_toggletips(){
        document.querySelectorAll(`.${CLASS_STATUS_ELE_MESSAGE}`).forEach(ele => {
            if(isDisplayed(ele)){
                hide_one_tooltip(ele);
            }
        })
    }


    function hide_one_tooltip(ele){
        ele.textContent = '';
        ele.classList.add(CLASS_STATUS_ELE_HIDDEN);
    }
    
    
    function show_one_toggletip(messageEle, statusEle){
        messageEle.textContent = find_string_for_statusEle_message(statusEle);
        // const rect = statusEle.getBoundingClientRect();
        // messageEle.style.top = `${rect.bottom}px`;
        // messageEle.style.left = `${rect.left}px`;
        messageEle.classList.remove(CLASS_STATUS_ELE_HIDDEN);
    }
    

    function add_closeOnClickOutside(messageEle, statusEle){
        function closeFunction(){
            hide_one_tooltip(messageEle);
            document.removeEventListener('click', handleLockAndCloseOnOutsideClick);
        }
    
        function handleLockAndCloseOnOutsideClick(e){
            closeOnClickOutside(e, statusEle, closeFunction);
        }

        document.addEventListener('click', handleLockAndCloseOnOutsideClick);
    }

    
    function find_ele_statusEle(e){
        return e.target.classList.contains(CLASS_STATUS_ELE) ?
                e.target
                : e.target.closest(`.${CLASS_STATUS_ELE}`);
    }
    

    function find_ele_statusEle_message(statusEle){
        if(statusEle === undefined || statusEle === null){
            window.alert("Can't display status details, try the job page instead.")
            return;
        }
        return statusEle.querySelector(`.${CLASS_STATUS_ELE_MESSAGE}`);
    }
    

    function find_string_for_statusEle_message(statusEle){
        const button = statusEle.querySelector(`.${CLASS_STATUS_ELE_BUTTON}`);
        return button.dataset.toggletip_content === undefined ?
            "No details are available"
            : button.dataset.toggletip_content;
    }
});


