function JobPage(){
    // Stuff to be fetched from the backend or something
    const job_id = window.JOB_ID;

    // how to get these
    const job_name = '2108-001';
    const customer_name = 'Aardvark';
    const URL_GET_DATA = '/get_data';
    const currency = 'GBP';

    // States fetched from server
    const [itemList, setItemList] = React.useState([]);
    const [poList, setPoList] = React.useState([]);
    const [priceAccepted, setPriceAccepted] = React.useState(false);
    const [docQuantities, setDocQuantities] = React.useState([]);

    const { data, error, isLoaded } = useFetch(url_for_page_load(URL_GET_DATA, job_id, 'job_page_root'));
    React.useEffect(() => {
        if(typeof data.item_list !== 'undefined'){
            setItemList(data.item_list);
        }

        if(typeof data.po_list !== 'undefined'){
            setPoList(data.po_list);
        }

        if(typeof data.price_accepted !== 'undefined'){
            setPriceAccepted(data.price_accepted);
        }

        if(typeof data.doc_quantities !== 'undefined'){
            setDocQuantities(data.doc_quantities);
        }
    }, [data]);


    // These are to be derived from states
    var total_qty_all_items = () => {
        if(itemList.length === 0){
            return 0;
        }
        itemList.reduce((prev_total_qty, item) => {
            return parseInt(item.quantity) + prev_total_qty;
        })
    };

    var total_po_value = poList.reduce((prev_total_val, po) => {return parseFloat(po.value) + prev_total_val}, 0);
    var total_items_value = itemList.reduce((prev_total_val, item) => {return parseFloat(item.selling_price) + prev_total_val}, 0);
    var total_items_list_price = itemList.reduce((prev_total_val, item) => {return parseFloat(item.list_price) + prev_total_val}, 0);
    var value_difference_po_vs_items = total_po_value - total_items_value;

    var po_count = poList.length;

    var special_item_exists = itemList.some(item => item.excess_modules === true);
    var incomplete_item_exists = itemList.some(item => item.is_modular === true && item.is_complete === false);
    
    var products_list = ((items_list) => {
        var products = get_products_list(items_list);
        return populate_products_list_with_assignments(products, items_list);
    })(itemList);

    // Create object with a nested object for each product on the Job, with product_id as the key.
    function get_products_list(items_list){
        var result = {};

        for(var idx in items_list){
            var this_item = items_list[idx];
            var prod_id_as_str = this_item.product_id.toString();

            // If the product doesn't exist yet, add it now
            if(!(prod_id_as_str in result)){
                result[prod_id_as_str] = {
                    num_assigned: 0,
                    num_total: 0,
                    assignments: []
                };
            }

            // Update the total to take this_item into account
            result[prod_id_as_str].num_total += this_item.quantity;
        }
        return result;
    }

    function populate_products_list_with_assignments(result, items_list){
        // Set "used_by" and "num_assigned" by checking all the module_lists
        for(var pidx in items_list){
            var parent = items_list[pidx];
            if(parent.module_list != null && parent.module_list.length > 0){

                for(var midx in parent.module_list){
                    var child_prod_id_as_str = parent.module_list[midx].product_id.toString();
                    
                    // If there is no field in result for the child at this stage, something went wrong
                    if(!(child_prod_id_as_str in result)){
                        console.log('ERR: Products[] creation, missing product');
                        break;
                    }
                    // Update the child product's "num_assigned" and "assignments".
                    else{
                        // Modules store quantities on a "per parent item" basis, so multiply by parent.quantity to get the total
                        var total_used = parent.module_list[midx].quantity * parent.quantity;
                        result[child_prod_id_as_str].num_assigned += total_used;

                        // Setup an object with all the data needed to display this assignment under the child item
                        var assignment = {
                            quantity: total_used,
                            parent_qty: parent.quantity,
                            part_num: parent.part_number,
                            product_name: parent.product_name,
                            parent_id: parent.ji_id
                        };

                        result[child_prod_id_as_str].assignments.push(assignment);
                    }
                }
            }
        }
        return result;
    }


    var status_data = ((price_accepted, special_item_exists, incomplete_item_exists, po_count, value_difference_po_vs_items, doc_quantities, total_qty_all_items) => {
        var result = {};
        result['price_accepted'] = price_accepted;
        result['special_item_exists'] = special_item_exists;
        result['incomplete_item_exists'] = incomplete_item_exists;
        result['po_count'] = po_count;
        result['value_difference_po_vs_items'] = value_difference_po_vs_items;
        result['doc_quantities'] = doc_quantities;
        result['total_qty_all_items'] = total_qty_all_items;
        return result;
    })(priceAccepted, special_item_exists, incomplete_item_exists, po_count, value_difference_po_vs_items, docQuantities, total_qty_all_items);


    var items_data = ((items_list, products_list) => {
        var results = items_list;
        for(var idx in results){
            var target_prod_id_as_str = results[idx].product_id.toString();
            var product = products_list[target_prod_id_as_str];

            results[idx]['num_assigned'] = product.num_assigned;
            results[idx]['total_product_quantity'] = product.num_total;
            results[idx]['assignments'] = product.assignments;
        }
        return results;
    })(itemList, products_list);


    var po_data = ((value_difference_po_vs_items, total_items_value, total_po_value, po_list) => {
        var result = {
            difference: value_difference_po_vs_items,
            total_items_value: total_items_value,
            total_po_value: total_po_value,
            po_list: po_list
        };
        return result;
    })(value_difference_po_vs_items, total_items_value, total_po_value, poList);


    if(error){
        <LoadingErrorEle name='page' />
    }
    else if(!isLoaded){
        <LoadingEle />
    }

    return [
        <div>
            <JobHeadingSubsection   job_id = {job_id}
                                    job_name = {job_name}
                                    customer_name = {customer_name}
                                    status_data = {status_data}
                                    URL_GET_DATA = {URL_GET_DATA} />
            <JobContents    job_id = {job_id}
                            URL_GET_DATA = {URL_GET_DATA}
                            currency = {currency}
                            customer_name = {customer_name}
                            job_name = {job_name}
                            job_total_qty = {total_qty_all_items}
                            doc_quantities = {docQuantities}
                            items_data = {items_data}
                            po_data = {po_data}
                            price_accepted = {priceAccepted}
                            total_list = {total_items_list_price}
                            total_selling = {total_items_value} />
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
                                doc_quantities={props.doc_quantities}/>
            </section>
            <JobItems   job_id = {props.job_id}
                        URL_GET_DATA = {props.URL_GET_DATA}
                        items_data = {props.items_data}
                        currency = {props.currency}/>
            <section class="job-section pair-related">
                <JobPo  job_id = {props.job_id}
                        currency = {props.currency}
                        po_data = {props.po_data}
                        URL_GET_DATA = {props.URL_GET_DATA} />
                <JobPriceCheck      currency = {props.currency}
                                    price_accepted = {props.price_accepted}
                                    total_list = {props.total_list}
                                    total_selling = {props.total_selling}
                                    items_data = {props.items_data}/>
            </section>  
        </div>
    ];

}


// Render it to the page
ReactDOM.render(<JobPage />, document.querySelector(".job-page"));