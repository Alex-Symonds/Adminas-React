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
    var job_total_qty = 12;
    var root_statuses = [
        [STATUS_CODE_ATTN, 'Special item'],
        [STATUS_CODE_ACTION, 'PO missing'],
        [STATUS_CODE_ACTION, 'Price not accepted'],
        [STATUS_CODE_OK, 'testing OK status']
    ];

    return [
        <div>
            <JobHeadingSubsection   job_id={job_id}
                                    job_name={job_name}
                                    customer_name={customer_name}
                                    root_statuses={root_statuses}
                                    job_total_qty={job_total_qty}
                                    doc_quantities={doc_quantities} />
            <JobContents    job_id={job_id}
                            currency={currency}
                            customer_name={customer_name}
                            job_name={job_name}
                            job_total_qty={job_total_qty}
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