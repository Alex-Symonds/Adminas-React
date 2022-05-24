// React code for the Job page's heading subsection, including:
//      constants for status codes (also used react-job-page) and associated symbols
//      Heading
//      ToDo List toggle
//      Status strip
//      fetch for statuses that can't be altered from this page


// Status Code constants and associated "icon" texts.
// Notes: matching declarations exist in models.py; these are directly used as CSS classes.
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
                <JobStatusStrip root_statuses={props.root_statuses} />
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

    let css_classes = get_css_classes(todo.active);
    let display_text = get_display_text(todo.active);

    function get_css_classes(is_on_todo){
        css_classes = "status-indicator ";
        if(is_on_todo){
            return css_classes + "on";
        }
        return css_classes + "off";
    }

    function get_display_text(is_on_todo){
        if(is_on_todo){
            return "on";
        }
        return "off";
    }

    return [
        <div class="indicator-wrapper">
            <div class={css_classes}>
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
    // PLACEHOLDER: fetch this from server
    var static_statuses = [
        [STATUS_CODE_ACTION, 'WO pending'],
        [STATUS_CODE_ACTION, 'OC missing']
    ]

    const status_list = props.root_statuses.concat(static_statuses);

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