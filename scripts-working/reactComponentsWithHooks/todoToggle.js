/*
    Todo toggle on the Job page
    || Hook
    || Components
*/

// || Hook
function useTodoToggle(job_id){
    const [todo, setTodo] = React.useState(false);
    const [url, setUrl] = React.useState('');

    const { data, error, isLoaded } = useFetchWithLoading(url_for_page_load(job_id, 'todo'));
    React.useEffect(() => {
        set_if_ok(data, 'on_todo', setTodo);
        set_if_ok(data, 'url', setUrl);
    }, [data]);

    async function toggle_todo(){
        const todo_now = !todo;
        const method = todo_now ? 'PUT' : 'DELETE';
        const request = getFetchHeaders(method, {'job_id': job_id});

        try{
            const resp_data = await fetchAndJSON(url, request, 204);
            setTodo(todo_now);
        } 
        catch(e){
            alert(get_error_message(e))
        }
    }

    return {
        error,
        isLoaded,
        todo,
        toggle_todo
    }

}


// || Components
function JobToDoToggle({ job_id }){
    const {
        error,
        isLoaded,
        todo,
        toggle_todo
    } = useTodoToggle(job_id)

    return error 
        ? <LoadingErrorUI name='todo status' />
        : !isLoaded 
            ? <LoadingUI />
            : <JobToDoToggleUI  
                todo = { todo }
                toggle_todo = { toggle_todo } 
            />
}


function JobToDoToggleUI({ todo, toggle_todo }){
    return [
        <label className={"jobSideNav_toggleWrapper"}>
            <input  hidden
                    checked={ todo } 
                    disabled={false} 
                    name={"onToDo"} 
                    onChange={() => toggle_todo() }
                    type="checkbox"
                    value={ todo ? 'on' : 'off' }  
            />
            <span className={"toggle_labelText"}>
                todo
            </span>
            <Toggle
                isOn = { todo }
                displayStrOn = { "on" }
                displayStrOff = { "off" }
            />
        </label>
    ]
}


function Toggle({ isOn }){
    // Separate consts because otherwise changing the display text
    // would break the CSS
    const displayStr = isOn ? 'on' : 'off';
    const cssModifier = isOn ? 'on' : 'off';

    return <div className={`toggle toggle-${cssModifier}`}>
                <span className={`toggle_statusText toggle_statusText-${cssModifier}`}>
                    { displayStr }
                </span>
                <div className={`toggle_ball toggle_ball-${cssModifier}`} aria-hidden={true}></div>
            </div>
}