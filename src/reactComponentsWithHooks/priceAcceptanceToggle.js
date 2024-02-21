/*
    Price acceptance toggle
    || Hook
    || Components
*/

import { useState, useEffect } from 'react';

import { 
    fetchAndJSON, 
    get_error_message, 
    getRequestOptions, 
    set_if_ok, 
    url_for_url_list, 
    useFetchWithLoading,
} from '../util';

import { LoadingUI, LoadingErrorUI } from '../reactComponents/loadingAndEmptiness';

// || Hook
export function usePriceAcceptanceToggle(priceAccepted, updateState, job_id){
    const [API_URL, setAPI_URL] = useState(null);

    const { data, error, isLoaded } = useFetchWithLoading(url_for_url_list())
    useEffect(() => {
        set_if_ok(data, 'price_acceptance_url', setAPI_URL);
    }, [data]);

    async function toggle_acceptance(){
        if(API_URL === null){
            return;
        }

        const is_accepted_now = !priceAccepted;
        const request = getRequestOptions('PUT', {
            'new_status': is_accepted_now
        });

        const urlWithParams = `${API_URL}?job_id=${job_id}`;
        try{
            const resp_data = await fetchAndJSON(urlWithParams, request, 204);
            updateState('priceAccepted', is_accepted_now);
        }
        catch(e){
            alert(get_error_message(e));
        }
    }

    return {
        error,
        isLoaded,
        toggle_acceptance,
    }
}


// || Components
export function PriceAcceptanceToggle({ priceAccepted, priceAcceptedActions }){
    return priceAcceptedActions.error
        ? <LoadingErrorUI name='price acceptance toggle' />
        : !priceAcceptedActions.isLoaded
            ? <LoadingUI />
            :
            <PriceAcceptanceToggleUI 
                is_accepted = { priceAccepted }
                toggle_acceptance = { priceAcceptedActions.toggle_acceptance } 
            />
}


function PriceAcceptanceToggleUI({ is_accepted, toggle_acceptance }){
    const css_class = is_accepted ? 'on' : 'off';
    const display_text = is_accepted ? 'accepted' : 'NOT ACCEPTED';
    return (
        <div id="price_confirmation_status" className={"jobNarrowSection_content"}>
            <div className={'status-indicator ' + css_class}>
                <span className="status-name">selling price is</span>
                <button 
                    id="price_confirmation_button" 
                    onClick={ toggle_acceptance }
                >
                    { display_text }
                </button>
            </div>
        </div>
    )
}