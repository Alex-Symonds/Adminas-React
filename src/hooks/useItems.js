import { useState, useEffect } from 'react';

import { 
    fetchAndJSON,
    getRequestOptions,
    getUpdatedList,
    getUpdatedObjectFromList, 
    set_if_ok, 
    url_for_page_load,
    url_for_url_list, 
} from '../util';

import {
    useFetchWithLoading
} from './useFetchWithLoading.js';

export function useJobItems(itemsList, updateJobKey, job_id, reportError){
    const JOB_KEY = 'itemsList';
    const ID_KEY = 'ji_id';

    // Get the URL for the comments API by grabbing the URL list from
    // the generic "get data" endpoint
    const [API_URL, setAPI_URL] = useState("");
    const { data } = useFetchWithLoading(url_for_url_list());
    useEffect(() => {
        set_if_ok(data, 'api_items', setAPI_URL);
    }, [data]);


    async function create(beData){
        if(API_URL === ""){
            reportError("Creating items is not currently available, sorry!");
            return false;
        }

        const request = getRequestOptions('POST', beData);
        const resp_data = await fetchAndJSON(API_URL, request, 201);

        if(typeof resp_data.id_list !== 'undefined'){
            await addNewItemsToState(resp_data.id_list);
        }
        else {
            throw new Error('Page refresh recommended.');
        }
        return true;


        async function addNewItemsToState(listOfNewlyCreatedIDs){
            // The frontend doesn't have all the data it needs to create a new item by itself,
            // so request it from the server using the list of IDs it sent after creating the
            // items.

            const formattedForURL = listOfNewlyCreatedIDs.join('.');
            const get_url = `${API_URL}?ji_id_list=${formattedForURL}`;
            const getRequest = getRequestOptions('GET', null);
            const resp_data = await fetchAndJSON(get_url, getRequest, 200);

            const new_items_list = itemsList.concat(resp_data.jobitems);
            updateJobKey(JOB_KEY, new_items_list);
        } 
    }


    async function update(item_id, feObj, beObj){
        if(API_URL === ""){
            reportError("Updating items is not currently available, sorry!");
            return false;
        }

        const url = `${API_URL}?id=${item_id}`;
        const request = getRequestOptions('PUT', beObj);
        const resp_data = await fetchAndJSON(url, request, 204);

        // Changes to product and/or price list have knock-on effects on other
        // fields (e.g. list price, names) so if one of those has changed, 
        // update the entire item from the backend.
        if('product_id' in feObj || 'price_list_id' in feObj){
            await update_item_from_be(item_id);
        }
        else {
            updateItemInState(item_id, feObj);
        }

        // Changes to items can affect the status of documents, so update those too
        update_doc_state(item_id, feObj);

        return true;
    }

    async function update_item_from_be(item_id){
        if(API_URL === ""){
            reportError("Creating items is not currently available, sorry!");
            return false;
        }

        const url = `${API_URL}?ji_id=${item_id}`;
        const resp_data = await fetchAndJSON(url, null, 200);

        delete resp_data.http_code;
        delete resp_data.location;
        updateItemInState(item_id, resp_data);

        return true;
    }

    function updateItemInState(item_id, itemData){
        const updatedItem = getUpdatedObjectFromList(
            'item', itemsList, ID_KEY, item_id, itemData
        );
        updateJobKey(JOB_KEY, getUpdatedList(itemsList, ID_KEY, item_id, updatedItem));
        return true;
    }


    async function delete_f(item_id){
        if(API_URL === ""){
            reportError("Deletion of items is not currently available, sorry!");
            return false;
        }

        const url = `${API_URL}?id=${item_id}`;
        const request = getRequestOptions('DELETE', null);
        const resp_data = await fetchAndJSON(url, request, 204);

        // Deleting items can affect document validity
        update_doc_state(item_id, null);
        updateJobKey(JOB_KEY, itemsList.filter(ele => ele[ID_KEY] !== item_id));

        return true;
    }


    function update_doc_state(item_id, item_attributes){
        /*
        A document is considered "invalid" if it contains one or more line items which have been overcommitted,
        e.g. order confirmations show 5 x JobItemX, but JobItemX has quantity = 3.

        This situation occurs when a user creates a JobItem, assigns it to documents, then afterwards updates 
        the JobItem such that the new quantity is less than the number assigned.

        Any JobItem update that affects the quantity of JobItems (including deletion) can alter the validity 
        of documents, so when that happens, fetch fresh documents info from the server.
        */
        if(item_attributes === null || item_quantity_has_changed(itemsList, item_id, item_attributes)){
            fetch(url_for_page_load(job_id, 'documents'))
            .then(response => response.json())
            .then(resp_data => {
                if(resp_data.doc_list !== undefined){
                    updateJobKey('docList', resp_data.doc_list);
                }
                else{
                    throw Error("Document status failed to update on screen and is unreliable. Try refreshing the page.")
                }
            })
        }


        function item_quantity_has_changed(items_list, item_id, item_attributes){
            /*
                Depending on the source of the item update, item_attributes will either be:
                    > A full set of item data
                    > Only the keys that changed
            */
       
            // Shortcut #1: The absence of a quantity field means the quantity can't change
            if(!('quantity' in item_attributes)){
                return false;
            }
        
            // Shortcut #2: ji_id can't be updated from the front-end, so it shouldn't ever appear in "only keys that changed"
            // If it's absent, we know this is a list of changes-only, which includes quantity: ergo, quantity has changed.
            if(!('ji_id' in item_attributes)){
                return true;
            }
        
            // No more shortcuts: compare the old value to the new
            const new_quantity = item_attributes.quantity;
            var index = items_list.findIndex(i => i.ji_id === parseInt(item_id));
            if(index === -1){
                // Fallback to true: better an unnecessary fetch to telling the user everything is ok when it isn't
                return true;
            }
            const old_quantity = items_list[index].quantity;
        
            return parseInt(old_quantity) !== parseInt(new_quantity);
        }
    }

    return {
        create,
        update,
        remove: delete_f
    }
}
