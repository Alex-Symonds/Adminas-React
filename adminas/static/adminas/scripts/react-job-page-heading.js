// React code for the Job page's heading subsection, including:
//      constants for status codes (also used react-job-page) and associated symbols
//      Heading
//      ToDo List toggle
//      Status strip



// Status Code constants and associated "icon" texts.
// Notes: matching declarations exist in models.py; also, these are directly used as CSS classes.
const STATUS_CODE_OK = 'status_ok';
const STATUS_CODE_ACTION = 'status_action';
const STATUS_CODE_ATTN = 'status_attn';

function job_status_symbol(status_code){
    switch (status_code){
        case STATUS_CODE_OK:
            return 'ok';

        case STATUS_CODE_ATTN:
            return '!';

        case STATUS_CODE_ACTION:
            return '?';

        default:
            return '-';
    }
}


// Main component
function JobHeadingSubsection(props){
    return [
        <section class="job-heading-with-status">
            <div id="job_status_strip" class="subsection">
                <JobHeading     job_id = {props.job_id}
                                job_name = {props.job_name}
                                customer_name = {props.customer_name} />
                <JobStatusStrip status_data = {props.status_data} />
            </div>
        </section>
        ]
}

// First-level child: heading and todo toggle
function JobHeading(props){
    return [
            <div class="job-heading-with-extra">
                <h2>Job {props.job_name}</h2>
                <JobToDoIndicator   job_id = {props.job_id}/>
                <JobSubHeading      customer_name = {props.customer_name} />
            </div>
        ]
}

// Todo toggle
function JobToDoIndicator(props){
    const todo = {      // this will be a state later
        active: true
    };

    let css_class = todo.active ? 'on' : 'off';
    let display_text = todo.active ? 'on' : 'off';

    return [
        <div class="indicator-wrapper">
            <div class={'status-indicator ' + css_class}>
                <span class="status-name">to-do</span>
                <button class="todo-list-toggle" data-job_id={props.job_id} data-on_todo_list={todo.active}>{display_text}</button>
            </div>
        </div>
    ]
}

function JobSubHeading(props){
    if(props.customer_name != null){
        return <div class="subheading">for {props.customer_name}</div>
    }
    return null;
}



// First-level child: status strip
function JobStatusStrip(props){
    var status_list = list_of_job_statuses(props.status_data);
    return [
        <div class="job-status-ele-container">
            {status_list.map((tuple, index) => 
                <JobStatusElement   key = {index}
                                    status_code = {tuple[0]}
                                    message = {tuple[1]} />
            )}
        </div>
    ];
}

function JobStatusElement(props){
    let css_classes = "status-ele " + props.status_code;
    let icon_text = job_status_symbol(props.status_code);
    
    return [
        <div class={css_classes}>
            <span class="icon">{icon_text}</span>
            <span class="message">{props.message}</span>
        </div>
    ]
}


// Determine statuses to go in the strip, based on status_data object.
function list_of_job_statuses(status_data){
    // Set the order of appearance here.
    var result = [];
    result = result.concat(get_status_price_acceptance(status_data));
    result = result.concat(get_status_items(status_data));
    result = result.concat(get_status_po(status_data));
    result = result.concat(get_status_documents(status_data));
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

    // If there are no items, we can skip the rest
    if(data.total_qty_all_items == 0){
        result.push([STATUS_CODE_ACTION, 'No items']);
        return result;
    }

    // Display an extra notification if there's >0 special items (i.e. with more modules than "allowed")
    if(data.special_item_exists){
        result.push([STATUS_CODE_ATTN, 'Special item/s']);
    }

    // "Normal" item statuses
    if(data.incomplete_item_exists){
        result.push([STATUS_CODE_ACTION, 'Incomplete item/s']);
    }
    else {
        result.push([STATUS_CODE_OK, 'Items ok']);
    }

    return result
}

function get_status_po(data){
    // Note: returning an array within an array so that all statuses -- including
    // those that can return more than one result -- can be treated the same.
    if(data.po_count == 0){
        return [[STATUS_CODE_ACTION, 'PO missing']];
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

        if(data.total_qty_all_items == doc.issued_qty){
            result.push([STATUS_CODE_OK, prefix + "ok"]);
        }
        else if(data.total_qty_all_items == doc.issued_qty + doc.draft_qty){
            result.push([STATUS_CODE_ACTION, prefix + "pending"]);
        }
        else{
            result.push([STATUS_CODE_ACTION, prefix + "missing"]);
        }
    }

    return result;
}