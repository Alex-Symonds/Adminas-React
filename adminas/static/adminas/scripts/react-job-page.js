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
    var price_accepted = false;
    var items_list = [
        {
            ji_id: 1,
            product_id: 7,
            part_number: '123456',
            product_name: 'Name of this product',
            description: 'One liner waffle about product',
            standard_accessories: [
                {quantity: 1, product_name: "First standard accessory"},
                {quantity: 2, product_name: "Second standard accessory"}
            ],
            is_complete: false,
            is_modular: true,
            excess_modules: false,
            module_list: [
                {module_id: 1, product_id: 42, quantity: 1, name: '[AB18885] Small Kerflobbity'}
            ],    
            quantity: 1,
            selling_price: 500.00,
            price_list: {
                name: '2022-01',
                id: 2
            },
            list_price: 500.00,
            resale_perc: 25
        }
    ];

    // These are to be derived from states
    var total_qty_all_items = 12;
    var special_item_exists = true;
    var incomplete_item_exists = false;
    var po_count = 1;
    var value_difference_po_vs_items = 0;


    function compile_job_status_data(price_accepted, special_item_exists, incomplete_item_exists, po_count, value_difference_po_vs_items, doc_quantities, total_qty_all_items){
        var result = {};
        result['price_accepted'] = price_accepted;
        result['special_item_exists'] = special_item_exists;
        result['incomplete_item_exists'] = incomplete_item_exists;
        result['po_count'] = po_count;
        result['value_difference_po_vs_items'] = value_difference_po_vs_items;
        result['doc_quantities'] = doc_quantities;
        result['total_qty_all_items'] = total_qty_all_items;
        return result;
    }


    var status_data = compile_job_status_data(price_accepted, special_item_exists, incomplete_item_exists, po_count, value_difference_po_vs_items, doc_quantities, total_qty_all_items);
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
                            doc_quantities={doc_quantities}
                            items_list = {items_list} />
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
            <JobItems   job_id = {props.job_id}
                        items_list = {props.items_list}
                        currency = {props.currency}/>
        </div>
    ];

}



// Render it to the page
ReactDOM.render(<JobPage />, document.querySelector(".job-page"));