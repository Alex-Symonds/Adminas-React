/*
    Summary:
    Status strip

    Contents:
        || Status Code constants (for the status strip)
        || Status Strip 
        || Status Helper Functions

*/



// || Status Strip
function JobStatusStrip(props){
    var status_list = list_of_job_statuses(props.status_data);

    return [
        <div class="jobSummaryStatus_container">
            {status_list.map((tuple, index) =>
                <JobStatusElementUI key = {index}
                                    status_code = {tuple[0]}
                                    message = {tuple[1]} />
            )}
        </div>
    ]
}


function JobStatusElementUI(props){
    let css_classes = "status-ele " + props.status_code;
    let icon_text = get_job_status_symbol(props.status_code);

    return [
        <div class={css_classes}>
            <span class="icon">{icon_text}</span>
            <span class="message">{props.message}</span>
        </div>
    ]
}


// || Status Helper Functions: Determine statuses to go in the strip, based on status_data object.
function get_job_status_symbol(status_code){
    const statusSymbols = {
        [STATUS_CODE_OK]: 'ok',
        [STATUS_CODE_ATTN]: '!',
        [STATUS_CODE_ACTION]: '?'
    }

    if(status_code in statusSymbols){
        return statusSymbols[status_code];
    }
    return "-";
}


function list_of_job_statuses(status_data){
    // Set the order of appearance here.
    var result = [];
    result = result.concat(get_status_price_acceptance(status_data));
    result = result.concat(get_status_items(status_data));
    result = result.concat(get_status_po(status_data));
    result = result.concat(get_status_documents(status_data));
    result = result.concat(get_status_document_validity(status_data));
    return result;
}


function get_status_price_acceptance(data){
    // Note: returning an array within an array so that all statuses -- including
    // those that can return more than one result -- can be treated the same.
    if(data.price_accepted){
        return [[STATUS_CODE_OK, 'Price accepted']];
    }
    return [[STATUS_CODE_ACTION, 'Price not accepted']];
}


function get_status_items(data){
    var result = [];

    if(data.total_qty_all_items == 0){
        result.push([STATUS_CODE_ACTION, 'No items']);
        return result;
    }

    const special_item_exists = data.items_list.some(item => item.excess_modules === true);
    if(special_item_exists){
        result.push([STATUS_CODE_ATTN, 'Special item/s']);
    }

    const incomplete_item_exists = data.items_list.some(item => item.is_modular === true && item.is_complete === false);
    if(incomplete_item_exists){
        result.push([STATUS_CODE_ACTION, 'Item/s incomplete']);
    }
    else {
        result.push([STATUS_CODE_OK, 'Items ok']);
    }

    return result;
}


function get_status_po(data){
    // Note: returning an array within an array so that all statuses -- including
    // those that can return more than one result -- can be treated the same.
    if(data.po_count == 0){
        return [[STATUS_CODE_ACTION, 'PO missing']];
    }
    else if(data.has_invalid_currency_po === true){
        return[[STATUS_CODE_ACTION, 'PO currency mismatch']]
    }
    else if (data.value_difference_po_vs_items != 0){
        return [[STATUS_CODE_ACTION, 'PO discrepancy']];
    }
    return [[STATUS_CODE_OK, 'PO ok']];
}


function get_status_documents(data){
    var result = [];

    for(var idx in data.doc_quantities){
        var doc = data.doc_quantities[idx];
        var prefix = doc.doc_type + ' ';
        var issued_qty = parseInt(doc.qty_on_issued);
        var draft_qty = parseInt(doc.qty_on_draft);

        if(issued_qty > 0 && data.total_qty_all_items == issued_qty){
            result.push([STATUS_CODE_OK, prefix + "ok"]);
        }
        else if(issued_qty + draft_qty > 0 && data.total_qty_all_items == issued_qty + draft_qty){
            result.push([STATUS_CODE_ACTION, prefix + "pending"]);
        }
        else{
            result.push([STATUS_CODE_ACTION, prefix + "needed"]);
        }
    }

    return result;
}


function get_status_document_validity(data){
    let memo = {};
    let result = [];
    for(var idx in data.doc_list){
        var doc = data.doc_list[idx];
        var doc_type = doc.doc_type;

        if(!(doc_type in memo)){
            if(!doc.is_valid){
                memo[doc_type] = 1;
                result.push([STATUS_CODE_ACTION, `Invalid ${doc_type}`]);
            }
        }
    }
    return result;

}