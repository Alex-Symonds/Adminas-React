import { useState, useEffect } from 'react';

import { 
    fetchAndJSON,
    getRequestOptions,
    getUpdatedList,
    getUpdatedObjectFromList, 
    set_if_ok, 
    url_for_url_list, 
    useFetchWithLoading, 
} from '../util';

export function usePOs(poList, updateJobKey, reportError){
    const JOB_KEY = 'poList';
    const ID_KEY = 'po_id';

    const [API_URL, setAPI_URL] = useState("");
    const { data } = useFetchWithLoading(url_for_url_list());
    useEffect(() => {
        set_if_ok(data, 'api_po', setAPI_URL);
    }, [data]);


    async function create(feData, beData){
        if(API_URL === ""){
            reportError("Creation of POs is not currently available, sorry!");
            return false;
        }

        const request = getRequestOptions('POST', beData);
        const resp_data = await fetchAndJSON(API_URL, request, 201);

        const createdPO = feData;
        createdPO.po_id = resp_data.id;
        updateJobKey(JOB_KEY, [
            ...poList,
            createdPO
        ]);

        return true;
    }

    async function update(po_id, feData, beData){
        if(API_URL === ""){
            reportError("Updating POs is not currently available, sorry!");
            return false;
        }

        const URL = `${API_URL}?id=${po_id}`;
        const request = getRequestOptions('PUT', beData);
        const resp_data = await fetchAndJSON(URL, request, 204);
        
        const updatedPO = getUpdatedObjectFromList(
            'PO', poList, ID_KEY, po_id, feData
        );
        updateJobKey(JOB_KEY, getUpdatedList(poList, ID_KEY, po_id, updatedPO));

        return true;
    }


    async function remove(po_id){
        if(API_URL === ""){
            reportError("Deleting POs is not currently available, sorry!");
            return false;
        }

        const url = `${API_URL}?id=${po_id}`;
        const request = getRequestOptions('DELETE', null);
        const resp_data = await fetchAndJSON(url, request, 204);

        updateJobKey(JOB_KEY, poList.filter(ele => ele[ID_KEY] !== po_id));

        return true;
    }


    return {
        create,
        update,
        remove
    }
    
}