function nbsp(){
    return '\u00A0';
}

function PriceComparisonTable(props){
    var difference_as_perc = props.difference / props.second_value * 100;
    return [
        <table id="po-discrepancy" class="price-comparison">
            <tr><th>{props.first_title}</th><td>{props.currency}</td><td class="po-total-price-f number">{format_money(props.first_value)}</td><td></td></tr>
            <tr><th>{props.second_title}</th><td>{props.currency }</td><td class="selling-price number">{format_money(props.second_value)}</td><td></td></tr>
            <tr class="conclusion"><th>Difference</th><td>{props.currency}</td><td class="diff-val number">{format_money(props.difference)}</td><td><span class="diff-perc">{format_percentage(difference_as_perc)}</span></td></tr>
        </table>
    ]
}

function QuantityNameLi(props){
    return [
        <li>{ props.quantity } x {props.name}</li>
    ]
}

function get_placeholder_options(){
    return [
        {id: 1, display_str: "Test thingy"},
        {id: 2, display_str: "Another test thingy"}
    ]
}

// Create a <select> element with a list of valid options obtained from the backend.
// onChange it calls "props.handle_change(e.target)" so the parent can extract whatever info is needed from the <select> element.
function SelectBackendOptions(props){
    const url = props.api_url + '?type=select_options_list&name=' + props.get_param;
    const { data, error, isLoaded } = useFetch(url);
    if(error){
        return <LoadingErrorEle />
    }
    
    else if (typeof data.opt_list === 'undefined'){
        return <LoadingEle />
    }

    else{
        return [
            <select name={props.select_name} id={props.select_id} required={props.is_required} onChange={(e) => props.handle_change(e.target)}>
                <OptionEmptyDefault default_id = {props.default_id} selected_opt_id = {props.selected_opt_id}/>
                {
                    data.opt_list.map((option) => {
                        var is_selected =   option.id == props.selected_opt_id
                                            ||
                                            (   props.selected_opt_id == ''
                                                &&
                                                option.id == props.default_id
                                            );

                        return <OptionIdAndName key = {option.id.toString()}
                                                id = {option.id}
                                                name = {option.display_str}
                                                is_selected = {is_selected}
                                                />
                    })
                }
            </select>
        ]
    }
}

// Part of <select>. This is a "none" option to add above the "real" options.
function OptionEmptyDefault(props){
    if(props.default_id != null){
        return null;
    }

    if(props.selected_opt_id == null){
        return <option value="">---------</option>
    }

    return <option value="" selected>---------</option>
}

// Part of <select>. Add an option using a single id / name pair.
function OptionIdAndName(props){
    if(props.is_selected){
        return <option value={props.id} selected>{props.name}</option>
    }
    return <option value={props.id}>{props.name}</option>
}


function LoadingEle(props){
    return <div class="loading">Loading...</div>
}

function LoadingErrorEle(props){
    return <div class="loading error">Error loading { props.name }</div>
}


const useFetch = url => {
    const [data, setData] = React.useState([]);
    const [error, setError] = React.useState(null);
    const [isLoaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
        const fetchData = async () => {
            const my_fetch = await fetch(url)
            .then(response => response.json())
            .then(resp_json => {
                setData(resp_json);
                setLoaded(true);
            })
            .catch(error => {
                setError(error);
                setLoaded(true);
            });
        };
        fetchData();
    }, [url]);

    return { data, error, isLoaded };
};


function url_for_page_load(main_url, job_id, name){
    return `${main_url}?job_id=${job_id}&type=page_load&name=${name}`;
}

function url_for_url_list(main_url, job_id){
    return `${main_url}?job_id=${job_id}&type=urls`;
}

function format_money(float_value){
    return float_value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})
}

function format_percentage(perc){
    return perc.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '%';
}

function SubmitButton(props){
    // Needs submit()
    return <button class="button-primary" onClick={ props.submit }>submit</button>
}

function DeleteButton(props){
    // Needs "user_has_permission" boolean (false = don't render) and delete()
    if(!props.user_has_permission){
        return null;
    }
    return <button class="button-warning delete-btn" onClick={ props.delete }>delete</button>
}

function CancelButton(props){
    // Needs cancel() for onClick
    return <button class="close" onClick = { props.cancel }><span>close</span></button>
}

function EditorControls(props){
    // Needs sumbit(), delete(), want_delete
    return [
        <div class="controls">
            <SubmitButton   submit = { props.submit }/>
            <DeleteButton   delete = { props.delete } 
                            user_has_permission = { props.want_delete }  />
        </div>
    ]
}

const OLDupdateBackend = (url, method, body_obj) => {
    const [data, setData] = React.useState([]);
    const [error, setError] = React.useState(null);
    const [isLoaded, setLoaded] = React.useState(false);

    React.useEffect(() => {
        const fetchData = async () => {
            const my_fetch = await fetch(url, {
                method: method,
                body: JSON.stringify(body_obj),
                headers: getDjangoCsrfHeaders(),
                credentals: 'include'
            })
            .then(response => response.json())
            .then(resp_json => {
                setData(resp_json);
                setLoaded(true);
            })
            .catch(error => {
                setError(error);
                setLoaded(true);
            });
        };
        fetchData();
    }, [url]);

    return { data, error, isLoaded };
};


const updateBackend = (url, method, body_obj) => {
    let isLoaded = false;
    let data = null;
    fetch(url, {
            method: method,
            body: JSON.stringify(body_obj),
            headers: getDjangoCsrfHeaders(),
            credentals: 'include'
        })
        .then(response => response.json())
        .then(resp_json => {
            data = resp_json;
            let error = null;
            isLoaded = true;
            return { data, error, isLoaded };
        })
        .catch(error => {
            isLoaded = true;
            return { data, error, isLoaded };
        });
};

function getFetchHeaders(method, body_obj){
    return {
        method: method,
        body: JSON.stringify(body_obj),
        headers: getDjangoCsrfHeaders(),
        credentals: 'include' 
    }
}

    



function BackendError(props){    
    // Needs "message" -- which is null as a deafult -- and "turn_off_error()"
    if(props.message === null){
        return null;
    }
    return [
        <div class="temp-warning-msg">
            { props.message }
            <CancelButton   cancel = { props.turn_off_error } />
        </div>]
}



// Taken from Django documentation for CSRF handling.
function getDjangoCsrfHeaders(){
    // Prepare for CSRF authentication
    var csrftoken = getCookie('csrftoken');
    var headers = new Headers();
    headers.append('X-CSRFToken', csrftoken);
    return headers;
}

// Taken from Django documentation for CSRF handling.
function getCookie(name) {
    // Gets a cookie.
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}