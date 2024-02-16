/*
    || Hook
    || ErrorWithClearUI
    || ErrorModal
*/

// || Hook
function useErrorWithClear(){
    const [message, setMessage] = React.useState(null);

    function set(erroryThing){
        setMessage(getErrorMessage(erroryThing));
    }

    function clear(){
        setMessage(null);
    }

    function getErrorMessage(erroryThing){
        // Support users passing in a string or an error object
        return typeof erroryThing === 'string' 
            ? erroryThing
            : typeof erroryThing === 'object' && 'message' in erroryThing
                ? erroryThing.message
                : "Something has gone wrong. Try refreshing the page.";
    }

    return {
        message: message,
        set: set,
        clear: clear
    }
}


// || ErrorWithClearUI = Little tag-like error to insert within a form
function ErrorWithClearUI({ message, clear }){    
    return [
        <div class={CLASS_ERROR_MESSAGE}>
            <div class="message">{ message }</div>
            <CancelButton   
                cancel = { clear } 
            />
        </div>]
}

// || ErrorModal = Big modal to blare across the screen
function ErrorModal({message, clear}){
    return  <Modal close={clear}>
                <section className={"bigErrorMessage"}>
                    <h2 className={"bigErrorMessage_heading"}>
                        Error
                    </h2>
                    <p className={"bigErrorMessage_genericText"}>
                        The following error has occurred:
                    </p>
                    <p className={"bigErrorMessage_specificError"}>
                        { message }
                    </p>
                    <p className={"bigErrorMessage_genericText"}>
                        If the error did not contain any specific instructions to resolve the issue, try refreshing the page.
                    </p>

                </section>
            </Modal>
}
