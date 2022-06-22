function JobPage(){
    // || Variables from Django
    const job_id = window.JOB_ID;
    const URL_GET_DATA = window.URL_GET_DATA;

    // || States fetched from server to begin with
    // "jobMain" is for data which: a) can't be altered on the Job page, so it will only change once (from "empty" to "loaded")
    // b) is used by more than one child component
    const [jobMain, setJobMain] = React.useState({
                                        currency: '',
                                        doc_quantities: []
                                    });
    const [urlItems, setUrlItems] = React.useState('');
    const [urlDocs, setUrlDocs] = React.useState('');

    // These states can be changed on the job page
    const [itemsList, setItemsList] = React.useState([]);
    const [poList, setPoList] = React.useState([]);
    const [docList, setDocs] = React.useState([]);
    const [priceAccepted, setPriceAccepted] = React.useState(false);


    // Fetch data from server and update states
    const { data, error, isLoaded } = useFetch(url_for_page_load(URL_GET_DATA, job_id, 'job_page_root'));
    React.useEffect(() => {
        if(typeof data.item_list !== 'undefined'){
            setItemsList(data.item_list);
        }

        if(typeof data.po_list !== 'undefined'){
            setPoList(data.po_list);
        }

        if(typeof data.doc_list !== 'undefined'){
            setDocs(data.doc_list);
        }

        if(typeof data.price_accepted !== 'undefined'){
            setPriceAccepted(data.price_accepted);
        }

        if(typeof data.main !== 'undefined'){
            setJobMain(data.main);
        }

        if(typeof data.items_url !== 'undefined'){
            setUrlItems(data.items_url);
        }

        if(typeof data.docbuilder_url !== 'undefined'){
            setUrlDocs(data.docbuilder_url);
        }
    }, [data]);


    // || State-derived variables
    // State-derived variable which reported an error when used on an empty list so eh, here you go
    var total_qty_all_items = () => {
        if(itemsList.length === 0){
            return 0;
        }
        itemsList.reduce((prev_total_qty, item) => {
            return parseInt(item.quantity) + prev_total_qty;
        })
    };

    // State-derived variables relating to money
    var total_po_value = poList.reduce((prev_total_val, po) => { return parseFloat(po.value) + prev_total_val }, 0);
    var total_items_value = itemsList.reduce((prev_total_val, item) => { return parseFloat(item.selling_price) + prev_total_val }, 0);
    var total_items_list_price = itemsList.reduce((prev_total_val, item) => { return (parseFloat(item.list_price_each) * parseInt(item.quantity) ) + prev_total_val }, 0);
    var value_difference_po_vs_items = total_po_value - total_items_value;

    // State-derived variables for modular item support
    var special_item_exists = itemsList.some(item => item.excess_modules === true);
    var incomplete_item_exists = itemsList.some(item => item.is_modular === true && item.is_complete === false);
    
    // || Objects
    // Package up related data (and sometimes derived data) for convenient passing around as props
    var status_data = get_status_data_object(priceAccepted, special_item_exists, incomplete_item_exists,  poList.length, value_difference_po_vs_items, jobMain.doc_quantities, total_qty_all_items);
    var po_data = get_po_data_object(value_difference_po_vs_items, total_items_value, total_po_value, poList);


    // || Updating states
    function update_item(item_id, item_attributes){
        console.log(`Updating item ID #${item_id} with this:`);
        console.log(item_attributes);

        var index = itemsList.findIndex(i => i.ji_id === parseInt(item_id));
        if(index === -1){
            return;
        }

        // If the user just changed the product ID and/or price list ID, this will have implications for 2-6 other fields,
        // so grab a full set of fresh data from the server.
        var target_item = itemsList[index];
        if('product_id' in item_attributes || 'price_list_id' in item_attributes){
            var product_changed = 'product_id' in item_attributes && target_item.product_id != item_attributes.product_id;
            var price_list_changed = 'price_list_id' in item_attributes && target_item.price_list_id != item_attributes.price_list_id;

            if(product_changed || price_list_changed){
                // const { data, error, isLoaded } = useFetch(`${urlItems}?ji_id=${item_id}`;
                // request full set of item info from BE
                // item_attributes = the entire JSON string sent by the server
                console.log(`PLACEHOLDER: FETCH DATA FOR ITEM ID#${item_id}`);
                item_attributes.description = 'placeholder for a new desc from server';
                item_attributes.price_list_name = 'PLC1234.05';
            }

        }

        setItemsList([
            ...itemsList.slice(0, index),
            Object.assign(itemsList[index], item_attributes),
            ...itemsList.slice(index + 1)
        ]);
    }

    function delete_item(item_id){
        var index = itemsList.findIndex(i => i.ji_id === parseInt(item_id));
        if(index === -1){
            return;
        }
        setItemsList([
            ...itemsList.slice(0, index),
            ...itemsList.slice(index + 1)
        ]);  
    }

    function create_po(po_id, po_attributes){
        po_attributes['po_id'] = po_id;
        setPoList(prevState => ([
            ...prevState,
            po_attributes
        ]));
    }

    function update_po(po_id, po_attributes){
        var index = poList.findIndex(po => po.po_id === parseInt(po_id));
        if(index === -1){
            return;
        }
        setPoList([
            ...poList.slice(0, index),
            Object.assign(poList[index], po_attributes),
            ...poList.slice(index + 1)
        ]);
    }

    function delete_po(po_id){
        var index = poList.findIndex(i => i.po_id === parseInt(po_id));
        if(index === -1){
            return;
        }
        setPoList([
            ...poList.slice(0, index),
            ...poList.slice(index + 1)
        ]);
    }

    function update_price_accepted(is_accepted){
        setPriceAccepted(is_accepted);
    }

    function add_new_items(new_items){
        var new_state = itemsList.concat(new_items);
        setItemsList(new_state);
    }

    function update_doc_state_from_backend(){
        fetch(url_for_page_load(URL_GET_DATA, job_id, 'documents'))
        .then(response => response.json())
        .then(resp_data => {
            if(typeof resp_data.doc_list !== 'undefined'){
                setDocs(resp_data.doc_list)
            }
        })
        .catch(error => console.log(error));
    }





    // || Display. Handle fetch states, then go for the main event.
    if(error){
        <LoadingErrorEle name='page' />
    }
    else if(!isLoaded){
        <LoadingEle />
    }

    return [
        <div>
            <JobHeadingSubsection   job_id = {job_id}
                                    status_data = {status_data}
                                    URL_GET_DATA = {URL_GET_DATA} />
            <JobContents    job_id = {job_id}
                            URL_GET_DATA = {URL_GET_DATA}
                            currency = {jobMain.currency}
                            job_total_qty = {total_qty_all_items}
                            doc_quantities = {jobMain.doc_quantities}
                            items_data = {itemsList}
                            po_data = {po_data}
                            po_list = {poList}
                            price_accepted = {priceAccepted}
                            total_list = {total_items_list_price}
                            total_selling = {total_items_value}
                            update_item = { update_item }
                            delete_item = { delete_item }
                            URL_ITEMS = { urlItems }
                            update_po = { update_po }
                            delete_po = { delete_po }
                            update_price_accepted = { update_price_accepted }
                            add_new_items = { add_new_items }
                            doc_list = { docList }
                            URL_DOCS = { urlDocs }
                            update_doc_state = { update_doc_state_from_backend }
                            create_po = { create_po }  />
        </div>
    ]
}

function JobContents(props){
    return [
        <div class="job-page-sections-wrapper">
            <JobDetails     job_id = {props.job_id}
                            URL_GET_DATA = {props.URL_GET_DATA}
                            currency={props.currency} />
            <section class="job-section pair-related">
                <JobComments    job_id = {props.job_id}
                                URL_GET_DATA = {props.URL_GET_DATA}/>
                <JobDocuments   job_id = {props.job_id}
                                URL_GET_DATA = {props.URL_GET_DATA}
                                job_total_qty={props.job_total_qty}
                                doc_quantities={props.doc_quantities}
                                doc_list = {props.doc_list}
                                URL_DOCS = { props.URL_DOCS } />
            </section>
            <JobItems   job_id = {props.job_id}
                        URL_GET_DATA = {props.URL_GET_DATA}
                        items_data = {props.items_data}
                        currency = {props.currency}
                        update_item = { props.update_item }
                        delete_item = { props.delete_item }
                        URL_ITEMS = { props.URL_ITEMS }
                        add_new_items = { props.add_new_items }
                        update_doc_state = { props.update_doc_state } />
            <section class="job-section pair-related">
                <JobPo  job_id = {props.job_id}
                        currency = {props.currency}
                        po_data = {props.po_data}
                        po_list = {props.po_list}
                        URL_GET_DATA = {props.URL_GET_DATA}
                        update_po = { props.update_po }
                        delete_po = { props.delete_po }
                        create_po = { props.create_po }
                        />
                <JobPriceCheck      currency = {props.currency}
                                    price_accepted = {props.price_accepted}
                                    total_list = {props.total_list}
                                    total_selling = {props.total_selling}
                                    items_data = {props.items_data}
                                    update_item = { props.update_item }
                                    update_price_accepted = { props.update_price_accepted }
                                    />
            </section>  
        </div>
    ];
}

// || Objects
// Package up data necessary to determine the status notificiation tags in the heading
function get_status_data_object(price_accepted, special_item_exists, incomplete_item_exists, po_count, value_difference_po_vs_items, doc_quantities, total_qty_all_items){
    return {
        price_accepted: price_accepted,
        special_item_exists: special_item_exists,
        incomplete_item_exists: incomplete_item_exists,
        po_count: po_count,
        value_difference_po_vs_items: value_difference_po_vs_items,
        doc_quantities: doc_quantities,
        total_qty_all_items: total_qty_all_items
    };
}

// Package up data relating to purchase orders
function get_po_data_object(value_difference_po_vs_items, total_items_value, total_po_value){
    return {
        difference: value_difference_po_vs_items,
        total_items_value: total_items_value,
        total_po_value: total_po_value,
    };
}



// Render it to the page
ReactDOM.render(<JobPage />, document.querySelector(".job-page"));