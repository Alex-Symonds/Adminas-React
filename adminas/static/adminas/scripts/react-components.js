function nbsp(){
    return '\u00A0';
}

function PriceComparisonTable(props){
    var difference_as_perc = props.difference / props.second_value * 100;
    return [
        <table id="po-discrepancy" class="price-comparison">
            <tr><th>{props.first_title}</th><td>{props.currency}</td><td class="po-total-price-f number">{props.first_value.toFixed(2)}</td><td></td></tr>
            <tr><th>{props.second_title}</th><td>{props.currency }</td><td class="selling-price number">{props.second_value.toFixed(2)}</td><td></td></tr>
            <tr class="conclusion"><th>Difference</th><td>{props.currency}</td><td class="diff-val number">{props.difference.toFixed(2)}</td><td><span class="diff-perc">{difference_as_perc.toFixed(2)}</span></td></tr>
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

function SelectBackendOptions(props){
    const url = props.api_url + '?type=select_options_list&name=' + props.get_param;
    const { data, error, isLoaded } = useFetch(url);
    if(error){
        return <div>Error loading dropdown.</div>
    }
    
    else if (typeof data.opt_list === 'undefined'){
        return <div>Loading...</div>
    }

    else{
        return [
            <select name={props.select_name} id={props.select_id} required={props.is_required}>
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



