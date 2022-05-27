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
        },
        {
            ji_id: 1,
            product_id: 42,
            part_number: 'AB18885',
            product_name: 'Small Kerflobbity',
            description: 'A kerblobbity which is, get this, kinda small.',
            standard_accessories: [],
            is_complete: true,
            is_modular: false,
            excess_modules: false,
            module_list: [],    
            quantity: 1,
            selling_price: 5.00,
            price_list: {
                name: '2022-01',
                id: 2
            },
            list_price: 5.00,
            resale_perc: 25
        }
    ];

    var po_list = [
        {
            reference: 'abc',
            date_on_po: '01/01/1900',
            value: 500,
            date_received: '01/01/1900',
            po_id: 1
        }
    ];

    // These are to be derived from states
    var total_qty_all_items = items_list.reduce((prev_total_qty, item) => {
        return item.quantity + prev_total_qty;
    });

    var total_po_value = po_list.reduce((prev_total_val, po) => {return po.value + prev_total_val}, 0);
    var total_items_value = items_list.reduce((prev_total_val, item) => {return item.selling_price + prev_total_val}, 0);
    var total_items_list_price = items_list.reduce((prev_total_val, item) => {return item.list_price + prev_total_val}, 0);
    var value_difference_po_vs_items = total_po_value - total_items_value;

    var po_count = po_list.length;

    var special_item_exists = true;
    var incomplete_item_exists = false;
    

    var products_list = ((items_list) => {
        var products = get_products_list(items_list);
        return populate_products_list_with_assignments(products, items_list);
    })(items_list);

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
    })(price_accepted, special_item_exists, incomplete_item_exists, po_count, value_difference_po_vs_items, doc_quantities, total_qty_all_items);


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
    })(items_list, products_list);


    var po_data = ((value_difference_po_vs_items, total_items_value, total_po_value, po_list) => {
        var result = {
            difference: value_difference_po_vs_items,
            total_items_value: total_items_value,
            total_po_value: total_po_value,
            po_list: po_list
        };
        return result;
    })(value_difference_po_vs_items, total_items_value, total_po_value, po_list);





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
                            items_data = {items_data}
                            po_data = {po_data}
                            price_accepted = {price_accepted}
                            total_list = {total_items_list_price}
                            total_selling = {total_items_value} />
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
                        items_data = {props.items_data}
                        currency = {props.currency}/>
            <section class="job-section pair-related">
                <JobPo  job_id = {props.job_id}
                        currency = {props.currency}
                        po_data = {props.po_data} />
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