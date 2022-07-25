/*
    Summary:
    Root file for the Job page

    Contents:
        || JobPage component (includes states for items, POs, documents and price acceptance)
        || JobContents
        || Objects (for packaging related data)
        || Helpers
*/

function JobPage(){
    // Variables from Django
    const job_id = window.JOB_ID;
    const URL_GET_DATA = window.URL_GET_DATA;

    // States fetched from server to begin with
    // "jobMain" is for data which:
    //      a) can't be altered on the Job page, so it will only change once (from "empty" to "loaded")
    //      b) is used by more than one child component
    const [jobMain, setJobMain] = React.useState({
                                        currency: '',
                                        doc_quantities: [],
                                        URL_MODULE_MANAGEMENT: ''
                                    });
    const [urlItems, setUrlItems] = React.useState('');
    const [urlDocs, setUrlDocs] = React.useState('');
    const [itemsList, setItemsList] = React.useState([]);
    const [poList, setPoList] = React.useState([]);
    const [docList, setDocs] = React.useState([]);
    const [priceAccepted, setPriceAccepted] = React.useState(false);
    
    const { data, error, isLoaded } = useFetch(url_for_page_load(URL_GET_DATA, job_id, 'job_page_root'));
    React.useEffect(() => {
        set_if_ok(data, 'item_list', setItemsList);
        set_if_ok(data, 'po_list', setPoList);
        set_if_ok(data, 'doc_list', setDocs);
        set_if_ok(data, 'price_accepted', setPriceAccepted);
        set_if_ok(data, 'main', setJobMain);
        set_if_ok(data, 'items_url', setUrlItems);
        set_if_ok(data, 'docbuilder_url', setUrlDocs);
    }, [data]);


    // Updating states: JobItems
    function create_items(new_items){
        var new_items_list = itemsList.concat(new_items);
        setItemsList(new_items_list);
    }

    function update_item(item_id, item_attributes){
        // Updating existing items can affect document validity
        update_doc_state(item_id, item_attributes);
        list_state_update(itemsList, setItemsList, 'ji_id', item_id, item_attributes);
    }

    function delete_item(item_id){
        // Deleting items can affect document validity
        update_doc_state(item_id, null);
        list_state_delete(itemsList, setItemsList, 'ji_id', item_id);
    }


    // Updating states: POs
    function create_po(po_attributes){
        list_state_create_one(setPoList, po_attributes);
    }

    function update_po(po_id, po_attributes){
        list_state_update(poList, setPoList, 'po_id', po_id, po_attributes);
    }

    function delete_po(po_id){
        list_state_delete(poList, setPoList, 'po_id', po_id);
    }

    // Updating states: Documents
    function update_doc_state(item_id, item_attributes){
        /*
        This function decides whether to update the validity status of documents from the backend, then does so (if applicable).

        A document is considered "invalid" if it contains one or more line items which have been overcommitted,
        e.g. order confirmations show 5 x JobItemX, but JobItemX has quantity = 3.

        This occurs when a user creates a JobItem, assigns it to documents, then afterwards updates the JobItem 
        such that the new quantity is less than the number assigned.

        Updates are therefore needed in two cases:
            > User changed the quantity of a JobItem (decrease can cause the problem; increase can solve it)
            > User deleted a JobItem (this deletes document assignments too, which would solve an existing problem)
        */
        if(item_attributes === null || item_quantity_has_changed(itemsList, item_id, item_attributes)){
            update_doc_state_from_backend();
        }
    }

    function update_doc_state_from_backend(){
        fetch(url_for_page_load(URL_GET_DATA, job_id, 'documents'))
        .then(response => response.json())
        .then(resp_data => {
            set_if_ok(resp_data, 'doc_list', setDocs);
        })
        .catch(error => console.log(error));
    }

    // State-derived variables used in more than one child branch, so work them out once here
    const total_qty_all_items = itemsList.reduce((prev_total_qty, item) => { return parseInt(item.quantity) + prev_total_qty; }, 0);
    const total_po_value = poList.reduce((prev_total_val, po) => { return parseFloat(po.value) + prev_total_val }, 0);
    const total_items_value = itemsList.reduce((prev_total_val, item) => { return parseFloat(item.selling_price) + prev_total_val }, 0);
    const value_difference_po_vs_items = total_po_value - total_items_value;

    // Objects
    // Package up related data/methods for convenient passing around as props
    const status_data = get_status_data_object(priceAccepted, poList.length, value_difference_po_vs_items, jobMain.doc_quantities, total_qty_all_items, itemsList);
    const po_data = get_po_data_object(value_difference_po_vs_items, total_items_value, total_po_value, poList);
    const doc_data = get_documents_data_object(urlDocs, docList, jobMain.doc_quantities, total_qty_all_items);
    
    const actions_items = get_actions_object(urlItems, create_items, update_item, delete_item);
    const actions_po = get_actions_object(null, create_po, update_po, delete_po);

    const price_accepted_state = get_and_set(priceAccepted, setPriceAccepted);

    // Display. Handle loading states, then go for the main event.
    if(error){
        <LoadingErrorUI name='page' />
    }
    else if(!isLoaded || data === null){
        <LoadingUI />
    }

    return [
        <div>
            <JobHeadingSubsectionUI job_id = {job_id}
                                    status_data = {status_data}
                                    URL_GET_DATA = {URL_GET_DATA} />
            <JobContentsUI  actions_items = { actions_items }
                            actions_po = { actions_po }
                            currency = {jobMain.currency}
                            doc_data = { doc_data }
                            items_list = {itemsList}
                            job_id = {job_id}
                            po_data = { po_data }
                            po_list = { poList }
                            price_accepted_state = { price_accepted_state }
                            total_selling = { total_items_value }
                            URL_GET_DATA = { URL_GET_DATA }
                            URL_MODULE_MANAGEMENT = { jobMain.URL_MODULE_MANAGEMENT }
                            />
        </div>
    ]
}



function JobContentsUI(props){
    return [
        <div class="job-page-sections-wrapper">
            <JobDetails currency = { props.currency }   
                        job_id = { props.job_id }
                        URL_GET_DATA = { props.URL_GET_DATA }
                        />
            <section class="job-section pair-related">
                <JobComments    job_id = { props.job_id }
                                URL_GET_DATA = { props.URL_GET_DATA } />
                <JobDocumentsUI doc_data = { props.doc_data }
                                job_id = {props.job_id} />
            </section>
            <JobItems   actions_items = { props.actions_items }
                        currency = { props.currency }
                        items_list = { props.items_list }
                        job_id = { props.job_id }
                        URL_GET_DATA = { props.URL_GET_DATA }
                        URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                        />
            <section class="job-section pair-related">
                <JobPo  actions_po = { props.actions_po }
                        currency = { props.currency }
                        job_id = { props.job_id }
                        po_data = { props.po_data }
                        URL_GET_DATA = { props.URL_GET_DATA }
                        />
                <JobPriceCheck  actions_items = { props.actions_items }
                                currency = { props.currency }
                                items_list = { props.items_list }
                                job_id = { props.job_id }
                                price_accepted_state = { props.price_accepted_state }
                                total_selling = { props.total_selling }
                                URL_GET_DATA = { props.URL_GET_DATA }
                                />
            </section>  
        </div>
    ];
}

// || Objects
function get_status_data_object(price_accepted, po_count, value_difference_po_vs_items, doc_quantities, total_qty_all_items, items_list){
    return {
        price_accepted,
        po_count,
        value_difference_po_vs_items,
        doc_quantities,
        total_qty_all_items,
        items_list
    };
}

function get_po_data_object(value_difference_po_vs_items, total_items_value, total_po_value, po_list){
    return {
        difference: value_difference_po_vs_items,
        total_items_value: total_items_value,
        total_po_value: total_po_value,
        po_list: po_list
    };
}

function get_documents_data_object(URL_DOCS, doc_list, doc_quantities, total_quantity_items){
    return {
        URL_DOCS,
        doc_list,
        doc_quantities,
        total_quantity_items
    }
}

// || Helpers
function item_quantity_has_changed(items_list, item_id, item_attributes){
    // item_attributes should contain one of two things:
    //  1) an object with one key/value pair for each alteration the user just made (occurs for straightforward alterations)
    //  2) an object containing a complete set of JobItem properties (occurs when alterations had side effects, so it's easier to just replace the whole thing)

    // Attributes Type #1, quantity didn't change (i.e. the only circumstances under which "quantity" won't be in item_attributes)
    if(!('quantity' in item_attributes)){
        return false;
    }

    // Attributes Type #1, quantity DID change
    // Note: ji_id was chosen for this check because: a) it's a field that exists in Type #2 attributes and not in Type #1;
    // b) it's a database key with no other use, so hopefully it's the least likely property to ever be added to Type #1 in future.
    if(!('ji_id' in item_attributes)){
        return true;
    }

    // Attributes Type #2: compare the new quantity in item_attributes with the existing quantity in the state
    const new_quantity = item_attributes.quantity;

    var index = items_list.findIndex(i => i.ji_id === parseInt(item_id));
    if(index === -1){
        // Fallback to true: better an unnecessary fetch to telling the user everything is ok when it isn't
        return true;
    }
    const old_quantity = items_list[index].quantity;
    return parseInt(old_quantity) !== parseInt(new_quantity);
}



// Render it to the page
ReactDOM.render(<JobPage />, document.querySelector(".job-page"));