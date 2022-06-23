// Price Check section on the Job page

function JobPriceCheck(props){
    return [
        <section id="price_check_section" class="item">
            <h3>Prices</h3>
            <JobPriceCheckEmpty   is_empty = {props.items_data.length == 0}/>
            <PriceAcceptanceToggle  price_accepted = {props.price_accepted}
                                    update_price_accepted = { props.update_price_accepted }/>
            <JobPriceCheckSummary       currency = {props.currency}
                                        total_selling = {props.total_selling}
                                        total_list = {props.total_list}/>
            <JobPriceCheckDetails       data = { props.items_data }
                                        update_item = { props.update_item }
                                        URL_ITEMS = { props.URL_ITEMS }/>
        </section>
    ]
}

function JobPriceCheckEmpty(props){
    if(!props.is_empty){
        return null;
    }
    return [
        <p>Activates upon entering items.</p>
    ]
}

function PriceAcceptanceToggle(props){
    const [accState, setAccState] = React.useState({
        is_accepted: props.price_accepted,
        is_init_value: true
    });

    React.useEffect(() => {
        if(!accState.is_init_value){
            props.update_price_accepted(accState.is_accepted);
        }
    }, [accState]);

    var css_class = accState.is_accepted ? 'on' : 'off';
    var display_text = accState.is_accepted ? 'accepted' : 'NOT ACCEPTED';

    return [
        <div id="price_confirmation_status">
            <div class={'status-indicator ' + css_class}>
                <span class="status-name">selling price is</span>
                <button id="price_confirmation_button" onClick={() => setAccState({is_accepted: !accState.is_accepted, is_init_value: false})}>{display_text}</button>
            </div>
        </div>
    ]
}

function JobPriceCheckSummary(props){
    return [
        <div id="price_summary" class="subsection">
            <h4>Comparison to List Price</h4>
            <PriceComparisonTable   currency = {props.currency}
                                    difference = {props.total_selling - props.total_list}
                                    first_title = 'Line Items Sum'
                                    first_value = {props.total_selling}
                                    second_title = 'List Prices Sum'
                                    second_value = {props.total_list}
                                    />
        </div>
    ]
}

function JobPriceCheckDetails(props){

    const [activeEdit, setActiveEdit] = React.useState(null);

    function update_active_edit(item_id){
        setActiveEdit(item_id);
    }

    return [
        <div class="subsection">
            <h4>Details</h4>
            <table id="price_check_table" class="responsive-table">
                <thead>
                    <tr class="upper-h-row">
                        <th colspan={3}></th>
                        <th colspan={4}>vs. Price List</th>
                        <th colspan={4}>vs. Resale</th>
                    </tr>
                    <tr class="lower-h-row">
                        <th>part #</th>
                        <th>qty</th>
                        <th>sold @</th>
                        <th>version</th>
                        <th>value</th>
                        <th colspan={2}>difference</th>
                        <th>perc</th>
                        <th>value</th>
                        <th colspan={2}>difference</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        props.data.map((item) => 
                            <JobPriceCheckDetailsRow    key={item.ji_id.toString()}
                                                        data={item}
                                                        active_edit = { activeEdit }
                                                        edit_mode = { update_active_edit }
                                                        update_item = { props.update_item }
                                                        URL_ITEMS = { props.URL_ITEMS } />
                        )
                    }
                </tbody>
            </table>
        </div>
    ]
}

function JobPriceCheckDetailsRow(props){

    const [showName, setShowName] = React.useState(false);
    const [backendError, setBackendError] = React.useState(null);


    var selling_price = parseFloat(props.data.selling_price);
    var list_price = parseFloat(props.data.list_price_each) * parseInt(props.data.quantity);

    var difference_list = selling_price - list_price;

    var resale_price = ((resale_perc) => {
        var multiplier = 1 - (parseFloat(resale_perc) / 100);
        return list_price * multiplier;
    })(props.data.resale_perc);
    
    var difference_resale = selling_price - resale_price;

    function edit_on(){
        props.edit_mode(props.data.ji_id);
    }
    function edit_off(){
        props.edit_mode(null);
    }
    function want_edit(){
        return props.active_edit === props.data.ji_id;
    }

    function update_item(new_attributes){
        props.update_item(props.data.ji_id, new_attributes);
    }

    function backend_error(message){
        setBackendError(message);
    }

    function remove_error(){
        setBackendError(null);
    }

    return[
        <tr id={'price_check_row_' + props.data.ji_id }>
            <td class="description">
                <span class="details-toggle" onClick={() => setShowName(!showName)}>{props.data.part_number}</span>
                <JobPriceCheckProductNameSpan   product_name = {props.data.product_name}
                                                want_show = {showName} />
            </td>
            <td class="qty">{props.data.quantity}</td>
            <td class="selling-price-container">
                <BackendError   message = { backendError }
                                turn_off_error = { remove_error } />
                <span class="selling-price">{format_money(selling_price)}</span>
                <JobPriceCheckEditButton    active_edit = { props.active_edit }
                                            edit_mode = { edit_on } />
                <JobPriceCheckPriceEditor   want_edit = { want_edit() }
                                            cancel = { edit_off }
                                            selling_price = { selling_price }
                                            list_price = { list_price }
                                            resale_price = { resale_price }
                                            quantity = { props.data.quantity }
                                            part_number = { props.data.part_number }
                                            item_name = { props.data.product_name }
                                            update_item = { update_item }
                                            URL_ITEMS_WITH_ID = { `${props.URL_ITEMS}?id=${props.data.ji_id}` }
                                            backend_error = { backend_error }
                                            />
            </td>
            <td class="version">{props.data.price_list_name}</td>
            <td class="list-price">{format_money(list_price)}</td>
            <td class="list-diff-val">{format_money(difference_list)}</td>
            <td class="list-diff-perc">{format_percentage(difference_list / list_price * 100)}</td>
            <td class="resale-percentage">{format_percentage(parseFloat(props.data.resale_perc))}</td>
            <td class="resale-price">{format_money(resale_price)}</td>
            <td class="resale-diff-val">{format_money(difference_resale)}</td>
            <td class="resale-diff-perc">{format_percentage(difference_resale / selling_price * 100)}</td>
        </tr>
    ]
}

function JobPriceCheckProductNameSpan(props){
    if(!props.want_show){
        return null;
    }
    return <span class="details">{props.product_name}</span>
}

function JobPriceCheckEditButton(props){
    if(props.active_edit !== null){
        return null;
    }

    return <button class="edit-btn edit-icon" onClick={ props.edit_mode }><span>edit</span></button>
}

function JobPriceCheckPriceEditor(props){
    if(!props.want_edit){
        return null;
    }

    const [priceState, setPriceState] = React.useState({
        selling_price: props.selling_price,
        is_init_value: true
    });

    function handle_list_click(){
        update_price(props.list_price);
    }
    function handle_resale_click(){
        update_price(props.resale_price);
    }
    function update_price(input_price){
        setPriceState({
            selling_price: input_price,
            is_init_value: false
        });
    }

    function change_price(){
        const headers = getFetchHeaders('PUT', state_as_object_be());

        fetch(props.URL_ITEMS_WITH_ID, headers)
        .then(response => response.json())
        .then(resp_data => {
            if('message' in resp_data){
                props.backend_error(resp_data.message);
                props.cancel();
                return;
            }

            if('ok' in resp_data){
                props.update_item({
                    selling_price: priceState.selling_price
                });
                props.cancel();
            }
        })
        .catch(error => console.log('Error: ', error))
    }

    function state_as_object_be(){
        return {
            'selling_price': priceState.selling_price
        }
    }

    // Wait for the state to update, then send the new price all the way up to the itemList state.
    React.useEffect(() => {

        // If the user used the editor to set the price to the same price it was before (because Reasons), close the editor.
        if(!priceState.is_init_value && priceState.selling_price === props.selling_price){
            props.cancel();
            return;
        }

        // If the user used the editor to alter the price, update the price in the "main" state and then close the editor.
        if(!priceState.is_init_value && priceState.selling_price !== props.selling_price){
            change_price();
        }

    }, [priceState]);

    return [
        <div class="price-checker-edit-window form-like panel popout">
            <CancelButton cancel = {props.cancel}/>
            <h5 class="panel-header">Edit Price</h5>
            <p>{props.quantity} x [{props.part_number}] {props.item_name}</p>
            <div class="price-options-container">
                <h6>Click new price</h6>
                <PresetPriceButton  price_type = 'list'
                                    price_preset = {props.list_price}
                                    handle_click = {handle_list_click}
                                    />
                <PresetPriceButton  price_type = 'resale'
                                    price_preset = {props.resale_price}
                                    handle_click = {handle_resale_click}
                                    />
            </div>
            <ManualPriceInput   handle_submit = {update_price}/>
        </div>
    ]
}

function PresetPriceButton(props){
    return <button class="button-primary-hollow" onClick={props.handle_click}>{props.price_type} ({format_money(parseFloat(props.price_preset))})</button>
}
function ManualPriceInput(props){
    const [customPrice, setCustomPrice] = React.useState('');

    function handle_change(e){
        setCustomPrice(e.target.value);
    }

    function handle_submit(){
        props.handle_submit(customPrice);
    }

    return [
        <div class="combo-input-and-button">
            <span>Or enter your own and submit</span>
            <input type="number" step={0.01} name='new_price' value={customPrice} onChange={handle_change}></input>
            <SubmitButton submit={handle_submit} />
        </div>
    ]
}