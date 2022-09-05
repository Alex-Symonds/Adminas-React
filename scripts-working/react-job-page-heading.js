/*
    Summary:
    Heading section on the Job page, including the status warning tags

    Contents:
        || Status Code constants and associated "icon" texts
        || Main section
        || Heading and Todo Toggle
        || Status Strip
*/

// || Status Code constants and associated "icon" texts.
// Notes:
//  >> matching declarations exist in models.py
//  >> these are directly used as CSS classes.
const STATUS_CODE_OK = 'status_ok';
const STATUS_CODE_ACTION = 'status_action';
const STATUS_CODE_ATTN = 'status_attn';


// || Main section
function JobHeadingSubsectionUI(props){
    return [
        <section class="job-heading-with-status">
            <div id="job_status_strip" class="subsection">
                <JobHeading     job_id = { props.job_id }
                                URL_GET_DATA = { props.URL_GET_DATA } />
                <JobStatusStrip status_data = { props.status_data } />
            </div>
        </section>
        ]
}

// || Heading and Todo Toggle
function JobHeading(props){
    const [names, setNames] = React.useState({
        job_name: '',
        customer_name: ''
    });
    const { data, error, isLoaded } = useFetch(url_for_page_load(props.URL_GET_DATA, props.job_id, 'heading'));
    React.useEffect(() => {
        set_if_ok(data, 'names', setNames);
    }, [data]);

    // Handle async stuff
    if(error){
        <LoadingErrorUI name='names' />
    }
    else if(!isLoaded){
        <LoadingUI />
    }

    return <JobHeadingUI    customer_name = { names.customer_name }
                            job_id = { props.job_id }
                            job_name = { names.job_name }
                            URL_GET_DATA = { props.URL_GET_DATA }
                            />
}

function JobHeadingUI(props){
    return [
            <div class="job-heading-with-extra">
                <h2>Job { props.job_name }</h2>
                <JobToDoIndicator   job_id = { props.job_id }
                                    URL_GET_DATA = { props.URL_GET_DATA }/>
                <JobSubHeadingUI  customer_name = { props.customer_name } />
            </div>
        ]
}



// Todo toggle
function JobToDoIndicator(props){
    const [todo, setTodo] = React.useState(false);
    const [url, setUrl] = React.useState('');

    const { data, error, isLoaded } = useFetch(url_for_page_load(props.URL_GET_DATA, props.job_id, 'todo'));
    React.useEffect(() => {
        set_if_ok(data, 'on_todo', setTodo);
        set_if_ok(data, 'url', setUrl);
    }, [data]);


    function toggle_todo(){
        var todo_now = !todo;
        var method = todo_now ? 'PUT' : 'DELETE';
        var headers = getFetchHeaders(method, {'job_id': props.job_id});

        update_server(url, headers, resp_data => {
            if(status_is_good(resp_data, 204)){
                setTodo(todo_now);
            }
            else {
                alert(get_error_message(resp_data));
            }
        });
    }

    if(error){
        return <LoadingErrorUI name='todo status' />
    }
    else if (!isLoaded){
        return <LoadingUI />
    }

    return <JobToDoIndicatorUI  todo = { todo }
                                toggle_todo = { toggle_todo } />

}

function JobToDoIndicatorUI(props){
    let css_class = props.todo ? 'on' : 'off';
    let display_text = props.todo ? 'on' : 'off';
    return [
        <div class="indicator-wrapper">
            <div class={'status-indicator ' + css_class}>
                <span class="status-name">to-do</span>
                <button class="todo-list-toggle" onClick={ props.toggle_todo }>{display_text}</button>
            </div>
        </div>
    ]
}

function JobSubHeadingUI(props){
    if(props.customer_name != ''){
        return <div class="subheading">for {props.customer_name}</div>
    }
    return null;
}



// || Status Strip
function JobStatusStrip(props){
    var status_list = list_of_job_statuses(props.status_data);

    return [
        <div class="job-status-ele-container">
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
    let icon_text = job_status_symbol(props.status_code);
    
    return [
        <div class={css_classes}>
            <span class="icon">{icon_text}</span>
            <span class="message">{props.message}</span>
        </div>
    ]
}


// Status strip helpers: Determine statuses to go in the strip, based on status_data object.
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

        if(data.total_qty_all_items == issued_qty){
            result.push([STATUS_CODE_OK, prefix + "ok"]);
        }
        else if(data.total_qty_all_items == issued_qty + draft_qty){
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