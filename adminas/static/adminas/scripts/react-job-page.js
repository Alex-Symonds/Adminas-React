function JobPage(){
    // Stuff to be fetched from the backend or something
    const job_id = 2;
    const job_name = '2108-001';
    const customer_name = 'Aardvark';
    const currency = 'GBP';

    const doc_quantities = [
        {doc_type: 'WO', issued_qty: 1, draft_qty: 4},
        {doc_type: 'OC', issued_qty: 0, draft_qty: 1}
    ];

    // State plan:
    //  item_list[]
    //  po_list[]
    //  price_accepted (boolean)


    // These are to be derived from states
    var total_qty_all_items = 12;
    var price_is_accepted = false;
    var special_item_exists = true;
    var incomplete_item_exists = false;
    var po_count = 3;
    var value_difference_po_vs_items = 0;

    var root_statuses = [
        [STATUS_CODE_ATTN, 'Special item'],
        [STATUS_CODE_ACTION, 'PO missing'],
        [STATUS_CODE_ACTION, 'Price not accepted'],
        [STATUS_CODE_OK, 'testing OK status']
    ];


    function compile_job_status_data(price_is_accepted, special_item_exists, incomplete_item_exists, po_count, value_difference_po_vs_items, doc_quantities, total_qty_all_items){
        var result = {};
        result['price_is_accepted'] = price_is_accepted;
        result['special_item_exists'] = special_item_exists;
        result['incomplete_item_exists'] = incomplete_item_exists;
        result['po_count'] = po_count;
        result['value_difference_po_vs_items'] = value_difference_po_vs_items;
        result['doc_quantities'] = doc_quantities;
        result['total_qty_all_items'] = total_qty_all_items;
        return result;
    }

    

    var status_data = compile_job_status_data(price_is_accepted, special_item_exists, incomplete_item_exists, po_count, value_difference_po_vs_items, doc_quantities, total_qty_all_items);
    return [
        <div>
            <JobHeadingSubsection   job_id={job_id}
                                    job_name={job_name}
                                    customer_name={customer_name}
                                    status_data = {status_data} />
            <JobContents    job_id={job_id}
                            currency={currency}
                            customer_name={customer_name}
                            job_name={job_name}
                            job_total_qty={total_qty_all_items}
                            doc_quantities={doc_quantities} />
        </div>
    ]
}

function JobContents(props){

    return [
        <div class="job-page-sections-wrapper">
            <JobDetails     job_id = {props.job_id}
                            currency={props.currency}
                            customer_name={props.customer_name}
                            job_name={props.job_name} />
            <section class="job-section pair-related">
                <JobComments />
                <JobDocuments   job_id = {props.job_id}
                                job_total_qty={props.job_total_qty}
                                doc_quantities={props.doc_quantities}/>
            </section>
            
        </div>
    ];


    //     <JobItems />
    //     <JobPurchaseOrders />
    //     <JobPriceChecker />

}














function JobItems(props){

}
function JobPurchaseOrders(props){

}
function JobPriceChecker(props){

}






// Render it to the page
ReactDOM.render(<JobPage />, document.querySelector(".job-page"));