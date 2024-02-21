
import { useComments } from '../hooks/useComments';

import { useErrorWithClear } from "../reactComponentsWithHooks/errors";
import { usePriceAcceptanceToggle } from "../reactComponentsWithHooks/priceAcceptanceToggle";

import { useJobItems } from "./useItems";
import { usePOs } from "./usePOs";

export function useJobStateUpdater(job, updateJobKey, modalKit){
    const ID_FOR_MODAL_ERROR = 'jobState_update_error';
    
    const {
        message: errorMessage,
        set: setErrorMessage,
        clear: clearErrorMessage,
    } = useErrorWithClear();

    function reportError(e){
        setErrorMessage(e);
        modalKit.open(ID_FOR_MODAL_ERROR);
    }

    function clearError(){
        modalKit.close();
        clearErrorMessage();
    }

    function updateWithErrorWrapper(JOB_KEY, new_value){
        try{
            updateJobKey(JOB_KEY, new_value);
        }
        catch(e){
            reportError(e);
        }
    }

    return {
        comments: useComments(job.comments, updateWithErrorWrapper, setErrorMessage),
        jobItems: useJobItems(job.itemsList, updateWithErrorWrapper, job.id, setErrorMessage),
        po: usePOs(job.poList, updateWithErrorWrapper, setErrorMessage),
        priceAccepted: usePriceAcceptanceToggle(job.priceAccepted, updateWithErrorWrapper, job.id),
        errors: {
            clear: clearError,
            message: errorMessage,
            showError: modalKit.isOpenedBy(ID_FOR_MODAL_ERROR)
        }
    }
}