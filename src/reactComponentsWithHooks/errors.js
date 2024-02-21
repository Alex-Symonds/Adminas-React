/*
    || Hook
    || ErrorWithClearUI
    || ErrorModal
*/

// || Hook
import { useState } from 'react';
import { useRouteError } from "react-router-dom";

import { CancelButton } from '../reactComponents/buttons';
import { Modal } from '../reactComponents/modal';

import { CLASS_ERROR_MESSAGE } from '../util';

export function useErrorWithClear(){
    const [message, setMessage] = useState(null);

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

// || ErrorPage = For react-dom-router
export function ErrorWithRoute(){
    const error = useRouteError();
    return (
      <div id="error-page" className={"errorWithRoute"}>
        <h2>Oops!</h2>
        <p>Sorry, an unexpected error has occurred.</p>
        <p>
          <i>{error.statusText || error.message}</i>
        </p>
      </div>
    );
}


// || ErrorWithClearUI = Little tag-like error to insert within a form
export function ErrorWithClearUI({ message, clear }){    
    return (
        <div className={CLASS_ERROR_MESSAGE}>
            <div className="message">{ message }</div>
            <CancelButton   
                cancel = { clear } 
            />
        </div>
    )
}

// || ErrorModal = Big modal to blare across the screen
export function ErrorModal({message, clear}){
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
