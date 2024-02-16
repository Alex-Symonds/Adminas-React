/*
    There are several individual forms which, on submit/delete, want to:
        1) Call a form-specific async function to alter something on the server and in state
        2) Await to see if that worked
        3a) If it worked, close the form
        3b) If it didn't work, throw an error for display on the still-open form

    This hook handles that for them.

    Usage:
        const asyncHelper = useAsyncWithError(myCloseFn);

        function onClick(...){
            ...
            asyncHelper.handleSync(() => actions.update(whatever, argsAreNeeded, goHere, ...));
            ...
        }

        return { backendError: asyncHelper.asyncError, onClick, ...}
*/
function useAsyncWithError(closeFn){
    const asyncError = useErrorWithClear();

    async function handleAsync(asyncCallbackFn){
        try{
            const resp = await asyncCallbackFn();
            if(resp === true){
                closeFn();
            }
        }        
        catch(e){
            asyncError.set(e);
        }
    }

    return {
        asyncError,
        handleAsync,
    }
}