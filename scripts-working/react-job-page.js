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
    const job_id = window.JOB_ID;
    const URL_GET_DATA = window.URL_GET_DATA;

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


    function create_items(new_items){
        var new_items_list = itemsList.concat(new_items);
        setItemsList(new_items_list);
    }

    function update_item(item_id, item_attributes){
        // Updating existing items can affect document validity
        update_doc_state(item_id, item_attributes);
        update_list_state(itemsList, setItemsList, 'ji_id', item_id, item_attributes);
    }

    function delete_item(item_id){
        // Deleting items can affect document validity
        update_doc_state(item_id, null);
        remove_from_list_state(itemsList, setItemsList, 'ji_id', item_id);
    }

    function create_po(po_attributes){
        add_to_list_state(setPoList, po_attributes);
    }

    function update_po(po_id, po_attributes){
        update_list_state(poList, setPoList, 'po_id', po_id, po_attributes);
    }

    function delete_po(po_id){
        remove_from_list_state(poList, setPoList, 'po_id', po_id);
    }

    function update_doc_state(item_id, item_attributes){
        /*
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

    const total_qty_all_items = itemsList.reduce((prev_total_qty, item) => { return parseInt(item.quantity) + prev_total_qty; }, 0);
    const total_po_value = poList.reduce((prev_total_val, po) => { return po.currency == jobMain.currency ? parseFloat(po.value) + prev_total_val : prev_total_val }, 0);
    const total_items_value = itemsList.reduce((prev_total_val, item) => { return parseFloat(item.selling_price) + prev_total_val }, 0);
    const value_difference_po_vs_items = total_po_value - total_items_value;
    const has_invalid_currency_po = invalid_currency_po_exists(poList, jobMain.currency);

    const status_data = get_status_data_object(priceAccepted, poList.length, value_difference_po_vs_items, jobMain.doc_quantities, total_qty_all_items, itemsList, docList, has_invalid_currency_po);
    const po_data = get_po_data_object(value_difference_po_vs_items, total_items_value, total_po_value, poList, has_invalid_currency_po);
    const doc_data = get_documents_data_object(urlDocs, docList, jobMain.doc_quantities, total_qty_all_items);
    const actions_items = get_actions_object(urlItems, create_items, update_item, delete_item);
    const actions_po = get_actions_object(null, create_po, update_po, delete_po);
    const price_accepted_state = getter_and_setter(priceAccepted, setPriceAccepted);

    return <JobPageUI   actions_items = { actions_items }
                        actions_po = { actions_po }
                        currency = { jobMain.currency }
                        data = { data }
                        doc_data = { doc_data }
                        error = { error }
                        has_invalid_currency_po = { has_invalid_currency_po }
                        isLoaded = { isLoaded }
                        items_list = { itemsList }
                        job_id = { job_id }
                        po_data = { po_data }
                        po_list = { poList }
                        price_accepted_state = { price_accepted_state }
                        status_data = { status_data }
                        total_selling = { total_items_value }
                        URL_GET_DATA = { URL_GET_DATA }
                        URL_MODULE_MANAGEMENT = { jobMain.URL_MODULE_MANAGEMENT }
                        />
}


function JobPageUI(props){
    if(props.error){
        <LoadingErrorUI name='page' />
    }
    else if(!props.isLoaded || props.data === null){
        <LoadingUI />
    }
    return [
        <div>
            <JobHeadingSubsectionUI job_id = { props.job_id}
                                    status_data = { props.status_data}
                                    URL_GET_DATA = { props.URL_GET_DATA} />
            <JobContentsUI  actions_items = { props.actions_items }
                            actions_po = { props.actions_po }
                            currency = { props.currency}
                            doc_data = { props.doc_data }
                            has_invalid_currency_po = { props.has_invalid_currency_po }
                            items_list = { props.items_list}
                            job_id = { props.job_id}
                            po_data = { props.po_data }
                            po_list = { props.po_list }
                            price_accepted_state = { props.price_accepted_state }
                            total_selling = { props.total_selling }
                            URL_GET_DATA = { props.URL_GET_DATA }
                            URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                            />
        </div>
    ]
}


function JobContentsUI(props){
    return [
        <div class="job-page-sections-wrapper">
            {/* <section class="pair-related"> */}
                <JobDetails currency = { props.currency }   
                            job_id = { props.job_id }
                            URL_GET_DATA = { props.URL_GET_DATA }
                            />
                <JobComments    job_id = { props.job_id }
                                URL_GET_DATA = { props.URL_GET_DATA } />
            {/* </section>
            <section class="pair-related"> */}
                <JobDocumentsUI doc_data = { props.doc_data }
                                job_id = {props.job_id} />
                <JobPo  actions_po = { props.actions_po }
                        currency = { props.currency }
                        job_id = { props.job_id }
                        po_data = { props.po_data }
                        URL_GET_DATA = { props.URL_GET_DATA }
                        />
            {/* </section> */}
            <JobItems   actions_items = { props.actions_items }
                        currency = { props.currency }
                        items_list = { props.items_list }
                        job_id = { props.job_id }
                        URL_GET_DATA = { props.URL_GET_DATA }
                        URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                        />
            <JobPriceCheck  actions_items = { props.actions_items }
                            currency = { props.currency }
                            has_invalid_currency_po = { props.has_invalid_currency_po }
                            items_list = { props.items_list }
                            job_id = { props.job_id }
                            price_accepted_state = { props.price_accepted_state }
                            total_selling = { props.total_selling }
                            URL_GET_DATA = { props.URL_GET_DATA }
                            />
        </div>
    ];
}

// || Objects
function get_status_data_object(price_accepted, po_count, value_difference_po_vs_items, doc_quantities, total_qty_all_items, items_list, doc_list, has_invalid_currency_po){
    return {
        price_accepted,
        po_count,
        value_difference_po_vs_items,
        doc_quantities,
        total_qty_all_items,
        items_list,
        doc_list,
        has_invalid_currency_po
    };
}

function get_po_data_object(value_difference_po_vs_items, total_items_value, total_po_value, po_list, has_invalid_currency_po){
    return {
        difference: value_difference_po_vs_items,
        total_items_value: total_items_value,
        total_po_value: total_po_value,
        po_list: po_list,
        has_invalid_currency_po: has_invalid_currency_po
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

function item_quantity_has_changed(items_list, item_id, item_attributes){
    /*
    Sometimes item_attributes contains key/value pairs of only the fields which have changed, allowing 
    us to determine if quantity changed by the presence or absence of a 'quantity' key.
    Sometimes item_attributes contains a full set of data, regardless of what changed. Then we need to 
    check the actual quantity value.
    */

    // No quantity field = can't be a full set of info, so it must be changes-only where quantity didn't change.
    if(!('quantity' in item_attributes)){
        return false;
    }

    // Check for a field which always exists in the full set, but never in the list of changes.
    // If it's absent, we know this is a list of changes which included quantity: ergo, quantity has changed.
    if(!('ji_id' in item_attributes)){
        return true;
    }

    const new_quantity = item_attributes.quantity;

    var index = items_list.findIndex(i => i.ji_id === parseInt(item_id));
    if(index === -1){
        // Fallback to true: better an unnecessary fetch to telling the user everything is ok when it isn't
        return true;
    }
    const old_quantity = items_list[index].quantity;

    return parseInt(old_quantity) !== parseInt(new_quantity);
}


function invalid_currency_po_exists(po_list, job_currency){
    for(let idx = 0; idx < po_list.length; idx++){
        let this_po = po_list[idx];
        if(this_po.currency !== job_currency){
            return true;
        }
    }
    return false;
}



ReactDOM.render(<JobPage />, document.querySelector(".job-page"));