/*
    Job status strip
    || Components
    || Helper functions to determine status based on "statusData"
*/

import { useJobContext } from "../hooks/useJobContext";


// || Components
export function JobStatusStrip(){
    const { calc, job } = useJobContext();
    const { getStatuses, getSymbol } = jobStatusHelper();
    const statusList = getStatuses(calc, job);

    return (
        <div className="jobSummaryStatus_container">
            {statusList.map((tuple, index) =>
                <JobStatusElementUI key = {index}
                    message = { tuple[1] }
                    statusCode = { tuple[0] }
                    symbol = {  getSymbol(tuple[0]) }
                />
            )}
        </div>
    )
}


function JobStatusElementUI({message, statusCode, symbol}){
    let css_classes = "status-ele " + statusCode;

    return (
        <div className={css_classes}>
            <span className="icon">{symbol}</span>
            <span className="message">{message}</span>
        </div>
    )
}


// || Helper functions to determine status based on "statusData"
function jobStatusHelper(){
    // Notes:
    //  >> matching declarations exist in models.py
    //  >> these are directly used as CSS classes.
    const STATUS_CODE_OK = 'status_ok';
    const STATUS_CODE_ACTION = 'status_action';
    const STATUS_CODE_ATTN = 'status_attn';

    function getSymbol(statusCode){
        return statusCode === STATUS_CODE_OK
            ? 'ok'
            : statusCode === STATUS_CODE_ATTN
                ? '!'
                : statusCode === STATUS_CODE_ACTION
                    ? '?'
                    : '-';
    }

    function getStatuses(calc, job){
        const statusData = createStatusData(calc, job);
        // Set the order of appearance here.
        var result = [];
        result = result.concat(get_status_price_acceptance(statusData));
        result = result.concat(get_status_items(statusData));
        result = result.concat(get_status_po(statusData));
        result = result.concat(get_status_documents(statusData));
        result = result.concat(get_status_document_validity(statusData));
        return result;
    

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
        
            if(data.total_qty_all_items === 0){
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
            if(data.po_count === 0){
                return [[STATUS_CODE_ACTION, 'PO missing']];
            }
            else if(data.has_invalid_currency_po === true){
                return[[STATUS_CODE_ACTION, 'PO currency mismatch']]
            }
            else if (data.value_difference_po_vs_items !== 0){
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
        
                if(issued_qty > 0 && data.total_qty_all_items === issued_qty){
                    result.push([STATUS_CODE_OK, prefix + "ok"]);
                }
                else if(issued_qty + draft_qty > 0 && data.total_qty_all_items === issued_qty + draft_qty){
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
    }


    function createStatusData(calc, job){
        return {
            po_count: job.poList.length, 
            value_difference_po_vs_items: calc.value_difference_po_vs_items, 
            total_qty_all_items: calc.total_qty_all_items, 
            has_invalid_currency_po: calc.has_invalid_currency_po,
            price_accepted: job.priceAccepted, 
            items_list: job.itemsList, 
            doc_list: job.docList,
            doc_quantities: job.doc_quantities, 
        }
    }

    return {
        getSymbol,
        getStatuses
    }
}


