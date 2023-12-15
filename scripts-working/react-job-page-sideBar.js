/*
    Summary:
    Navigation of Job page sections

    Contents:
        || Main section
        || Todo toggle
        || Burger Menu (for toggling on/off on narrower screens)
*/


// || Main section
function JobSideNav(props){
    return [
        <section className={`jobSideNav jobSideNav-${ props.isOpen ? "open" : "closed" }`}>
            <button 
                className={"jobSideNav_closeButton close"}
                onClick={ () => props.close() }
                >
                <span>close</span>
            </button>
            <JobSidebarHeadingUI   
                job_id = { props.job_id }
                names = { props.names }
                URL_GET_DATA = { props.URL_GET_DATA } 
            />

            <ul className={"jobSideNav_list"}>
            {
                props.TABS.map((tabName) => {
                    return  <li>
                                <button
                                    className={`jobSideNav_button ${tabName === props.activeTab ? "jobSideNav_button-on" : ""}`}
                                    onClick={ () => props.updateActiveTab(tabName) }
                                    disabled={ tabName === props.activeTab }
                                    >
                                    {tabName}
                                </button>
                            </li>
                })
            }
            </ul>
        </section>
        ]
}


function JobSidebarHeadingUI(props){
    return [
            <div className={"jobSideNav_topWrapper"}>
                <div>
                    <h3 className={"jobSideNav_heading"}>
                        { props.names.job_name }
                    </h3>
                    <JobSidebarSubHeadingUI  
                        customer_name = { props.names.customer_name } 
                    />
                </div>
                <JobToDoToggle   
                    job_id = { props.job_id }
                    URL_GET_DATA = { props.URL_GET_DATA }
                />
            </div>
        ]
}


function JobSidebarSubHeadingUI(props){
    if(props.customer_name != ''){
        return <div class="jobSideNav_subheading">
            for {props.customer_name}
        </div>
    }
    return null;
}


// || Todo toggle
function JobToDoToggle(props){
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

    return <JobToDoToggleUI  todo = { todo }
                                toggle_todo = { toggle_todo } />

}


function JobToDoToggleUI(props){
    let css_class = props.todo ? 'on' : 'off';
    let display_text = props.todo ? 'on' : 'off';
    return [
            <label className={"jobSideNav_toggleWrapper"}>
                <input  hidden
                        checked={props.todo} type="checkbox"
                        disabled={false} name={"onToDo"} value={display_text}
                        onChange={() => props.toggle_todo() }
                />
                <span className={"toggle_labelText"}>
                    todo
                </span>
                <div className={`toggle toggle-${css_class}`}>
                    <span className={`toggle_statusText toggle_statusText-${css_class}`}>
                        {display_text}
                    </span>
                    <div className={`toggle_ball toggle_ball-${css_class}`} aria-hidden={true}></div>
                </div>
            </label>
    ]
}


// || Burger Menu
function BurgerMenuIcon({open}){
    return  <div className={"burgerMenu"}>
                <button
                    className = { "burgerMenu_button" }
                    onClick = { open }
                    > 
                    <span className={ "buttonSpan" }>
                        open menu
                    </span>
                </button>
            </div>
}







