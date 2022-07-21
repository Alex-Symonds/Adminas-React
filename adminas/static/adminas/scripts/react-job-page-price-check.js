/*
    Summary:
    Price check section on the Job page

    Contents:
        || Main section
        || Price acceptance toggle
        || Comparison table wrapper
        || Details table
        || Price check editor
*/

// Main section
function JobPriceCheck(props){
    var total_items_list_price = props.items_list.reduce((prev_total_val, item) => { return (parseFloat(item.list_price_each) * parseInt(item.quantity) ) + prev_total_val }, 0);

    return <JobPriceCheckUI actions_items = { props.actions_items }
                            currency = { props.currency } 
                            items_list = { props.items_list }
                            job_id = { props.job_id }
                            price_accepted_state = { props.price_accepted_state}
                            total_selling = { props.total_selling }
                            total_list = { total_items_list_price }
                            URL_GET_DATA = { props.URL_GET_DATA }
                            />
}

function JobPriceCheckUI(props){
    return [
        <section id="price_check_section" class="item">
            <h3>Prices</h3>
            <JobPriceCheckEmptyUI   is_empty = { props.items_list.length == 0 }/>
            <PriceAcceptanceToggle  job_id = { props.job_id }
                                    price_accepted_state = { props.price_accepted_state }
                                    URL_GET_DATA = { props.URL_GET_DATA } />
            <JobPriceCheckSummaryUI     currency = { props.currency }
                                        total_selling = { props.total_selling }
                                        total_list = { props.total_list } />
            <JobPriceCheckDetails       items_list = { props.items_list }
                                        actions_items = { props.actions_items } />
        </section>
    ]
}

function JobPriceCheckEmptyUI(props){
    if(!props.is_empty){
        return null;
    }
    return <EmptySectionUI  message = {"Activates upon entering items."}/>
}

// || Price acceptance toggle
function PriceAcceptanceToggle(props){

    // Fetch the URL for toggling the price check on the backend
    const [url, setUrl] = React.useState(null);
    const { data, error, isLoaded } = useFetch(url_for_url_list(props.URL_GET_DATA, props.job_id))
    React.useEffect(() => {
        set_if_ok(data, 'price_acceptance_url', setUrl);
    }, [data]);

    // Handle the user clicking the toggle button
    function toggle_acceptance(){
        let is_accepted_now = !props.price_accepted_state.get;
        var headers = getFetchHeaders('PUT', {
            'new_status': is_accepted_now
        });

        update_server(url, headers, resp_data => {
            if('error' in resp_data){
                console.log(`Error: ${resp_data.error}`);
            }
            else if('ok' in resp_data){
                props.price_accepted_state.set(is_accepted_now);
            }
        });
    }

    if(error){
        return <LoadingErrorUI name='price acceptance toggle' />
    }
    else if (!isLoaded){
        return <LoadingUI />
    }
    return <PriceAcceptanceToggleUI is_accepted = { props.price_accepted_state.get }
                                    toggle_acceptance = { toggle_acceptance } />
}

function PriceAcceptanceToggleUI(props){
    var css_class = props.is_accepted ? 'on' : 'off';
    var display_text = props.is_accepted ? 'accepted' : 'NOT ACCEPTED';
    return [
        <div id="price_confirmation_status">
            <div class={'status-indicator ' + css_class}>
                <span class="status-name">selling price is</span>
                <button id="price_confirmation_button" onClick={ props.toggle_acceptance }>{ display_text }</button>
            </div>
        </div>
    ]
}

// || Comparison table wrapper
function JobPriceCheckSummaryUI(props){
    return [
        <div id="price_summary" class="subsection">
            <h4>Comparison to List Price</h4>
            <PriceComparisonTable   currency = { props.currency }
                                    difference = { props.total_selling - props.total_list }
                                    first_title = 'Line Items Sum'
                                    first_value = { props.total_selling }
                                    second_title = 'List Prices Sum'
                                    second_value = { props.total_list }
                                    />
        </div>
    ]
}

// || Details table
function JobPriceCheckDetails(props){

    // Details allows users to edit prices directly from the table. Only one price at a time though.
    const [activeEdit, setActiveEdit] = React.useState(null);
    const editor_state = get_and_set(activeEdit, setActiveEdit);

    return <JobPriceCheckDetailsUI  actions_items = { props.actions_items }
                                    items_list = { props.items_list }
                                    editor_state = { editor_state }
                                    />
}

function JobPriceCheckDetailsUI(props){
    return [
        <div class="subsection">
            <h4>Details</h4>
            <table id="price_check_table" class="banded">
                <JobPriceCheckDetailsTableHeadUI />
                <JobPriceCheckDetailsTableBodyUI    actions_items = { props.actions_items }
                                                    active_edit = { props.active_edit }
                                                    items_list = { props.items_list }
                                                    editor_state = { props.editor_state }
                                                    />
            </table>
        </div>
    ]
}

function JobPriceCheckDetailsTableHeadUI(props){
    return [
        <thead>
            <tr class="upper-h-row">
                <th colspan={4}></th>
                <th colspan={4}>vs. Price List</th>
                <th colspan={4}>vs. Resale</th>
            </tr>
            <tr class="lower-h-row">
                <th>id</th>
                <th>part #</th>
                <th>qty</th>
                <th>sold @</th>
                <th>version</th>
                <th>expected</th>
                <th colspan={2}>difference</th>
                <th>discount</th>
                <th>expected</th>
                <th colspan={2}>difference</th>
            </tr>
        </thead>
    ]
}

function JobPriceCheckDetailsTableBodyUI(props){
    return [
        <tbody>
            {props.items_list.map((item) => 
                <JobPriceCheckDetailsTableRow   key = { item.ji_id.toString() }
                                                actions_items = { props.actions_items }
                                                active_edit = { props.active_edit }
                                                data = { item }
                                                editor_state = { props.editor_state }
                                                />
            )}
        </tbody>
    ]
}




function JobPriceCheckDetailsTableRow(props){

    // The individual JobItem is now known, so prepare some JobItem-specific stuff
    // Setup an edit object
    const editor = get_editor_object(props.data.ji_id, props.editor_state.get, props.editor_state.set);

    // Setup the items updater with the ID for this JobItem
    function update_item(new_attributes){
        props.actions_items.update_f(props.data.ji_id, new_attributes);
    }

    // Prepare the URL with GET params for this item
    const url_with_id = `${props.actions_items.url}?id=${props.data.ji_id}`;

    // Work out the numbers for this row and package them up nicely
    const price_calc = () => {
        var selling_price = parseFloat(props.data.selling_price);

        var list_price = parseFloat(props.data.list_price_each) * parseInt(props.data.quantity);
        var difference_list = selling_price - list_price;
    
        var resale_price = (resale_perc => {
            var multiplier = 1 - (parseFloat(resale_perc) / 100);
            return list_price * multiplier;
        })(props.data.resale_perc);
        
        var difference_resale = selling_price - resale_price;

        return {
            'selling_price': selling_price,
            'list_price': list_price,
            'difference_list': difference_list,
            'resale_price': resale_price,
            'difference_resale': difference_resale
        }
    }

    return <JobPriceCheckDetailsRowUI   calc = { price_calc() }
                                        data = { props.data }
                                        editor = { editor }
                                        update_item = { update_item }
                                        url_with_id = { url_with_id }
                                        />
}

// One row in the price check table
function JobPriceCheckDetailsRowUI(props){
    return[
        <tr id={'price_check_row_' + props.data.ji_id }>
            <td class="ji_id">
                <JobItemIdIcon ji_id = { props.data.ji_id }/>
            </td>
            <JobPriceCheckDetailsDescription    data = { props.data } />
            <td class="qty">{props.data.quantity}</td>
            <JobPriceCheckDetailsSellingPrice   calc = { props.calc }
                                                data = { props.data }
                                                editor = { props.editor }
                                                update_item = { props.update_item }
                                                url_with_id = { props.url_with_id }
                                                />
            <td class="version">
                <JobItemPriceListIconSpan price_list_name = { props.data.price_list_name } />
            </td>
            <td class="list-price">{ format_money(props.calc.list_price) }</td>
            <td class="list-diff-val">{ format_money(props.calc.difference_list) }</td>
            <td class="list-diff-perc">{ format_percentage(props.calc.difference_list / props.calc.list_price * 100, 2) }</td>
            <td class="resale-percentage">
                <JobItemNameTagSpan   name = { format_percentage(parseFloat(props.data.resale_perc)) } />
            </td>
            <td class="resale-price">{ format_money(props.calc.resale_price) }</td>
            <td class="resale-diff-val">{ format_money(props.calc.difference_resale) }</td>
            <td class="resale-diff-perc">{ format_percentage(props.calc.difference_resale / props.calc.resale_price * 100, 2) }</td>
        </tr>
    ]
}

// Description <td>, with the toggle-able name
function JobPriceCheckDetailsDescription(props){

    // Allow users to click on the part number to show/hide the name of the product
    const [showName, setShowName] = React.useState(false);
    function toggle_name(){
        var want_name = !showName;
        setShowName(want_name);
    }

    return <JobPriceCheckDetailsDescriptionUI   data = { props.data }
                                                toggle_name = { toggle_name }
                                                name_is_visible = { showName }
                                                />
 }

function JobPriceCheckDetailsDescriptionUI(props){
   return [
        <td class="description">
            <span class="details-toggle" onClick={ props.toggle_name }>{props.data.part_number}</span>
            <JobPriceCheckProductNameSpanUI product_name = {props.data.product_name}
                                            is_visible = { props.name_is_visible } />
        </td>
   ] 
}

function JobPriceCheckProductNameSpanUI(props){
    if(!props.is_visible){
        return null;
    }
    return <span class="details">{props.product_name}</span>
}

// Selling price <td>, with the price editor
function JobPriceCheckDetailsSellingPrice(props){

    // In the event of a backend error, the plan is to close the editor
    // and display the error in "read mode", so the state has been pushed up to here
    const [backendError, setBackendError] = React.useState(null);
    const backend_error = get_backend_error_object(backendError, setBackendError);

    return <JobPriceCheckDetailsSellingPriceUI  backend_error = { backend_error }
                                                calc = { props.calc }
                                                data = { props.data }
                                                editor = { props.editor }
                                                update_item = { props.update_item }
                                                url_with_id = { props.url_with_id }
                                                />
}

function JobPriceCheckDetailsSellingPriceUI(props){
    return [
        <td class="selling-price-container">
            <BackendErrorUI message = { props.backend_error.message }
                            turn_off_error = { props.backend_error.clear } />
            <span class="selling-price">{ format_money(props.calc.selling_price) }</span>
            <JobPriceCheckEditButtonUI  editor = { props.editor } />
            <JobPriceCheckPriceEditor   editor = { props.editor }
                                        calc = { props.calc }
                                        data = { props.data }
                                        update_item = { props.update_item }
                                        url_with_id = { props.url_with_id }
                                        backend_error = { props.backend_error }
                                        />
        </td>
    ]
}

function JobPriceCheckEditButtonUI(props){
    // When one item is being edited, remove ALL the edit buttons in the price checker table
    if(props.editor.active_id !== null){
        return null;
    }

    return <button class="edit-btn edit-icon" onClick={ props.editor.on }><span>edit</span></button>
}

// || Price editor
function JobPriceCheckPriceEditor(props){
    if(!props.editor.is_active){
        return null;
    }

    // Update backend and state for the new selling price
    function handle_list_click(){
        update_price(props.calc.list_price);
    }
    function handle_resale_click(){
        update_price(props.calc.resale_price);
    }

    function update_price(new_price){
        const new_attributes = {
            selling_price: new_price
        }
        const headers = getFetchHeaders('PUT', new_attributes);

        update_server(props.url_with_id, headers, resp_data => {
            if('message' in resp_data){
                props.backend_error.set(resp_data.message);
                props.editor.off();
            }
            else if('ok' in resp_data){
                props.backend_error.set('test much longer backend error which is waffling on about why something is not working and stuff');
                props.update_item(new_attributes);
                props.editor.off();
            }
        });
    }

    return <JobPriceCheckPriceEditorUI  calc = { props.calc }
                                        cancel = { props.editor.off }
                                        data = { props.data }
                                        handle_list_click = { handle_list_click }
                                        handle_resale_click = { handle_resale_click }
                                        update_price = { update_price }
                                        />
}

function JobPriceCheckPriceEditorUI(props){
    return [
        <div class="price-checker-edit-window form-like panel popout">
            <CancelButton cancel = { props.cancel }/>
            <h5 class="panel-header">Edit Price</h5>
            <p>{props.data.quantity} x [{ props.data.part_number }] { props.data.product_name }</p>
            <div class="price-options-container">
                <h6>Click new price</h6>
                <PresetPriceButtonUI    handle_click = { props.handle_list_click }
                                        price_preset = { props.calc.list_price }
                                        price_type = 'list'
                                        />
                <PresetPriceButtonUI    handle_click = { props.handle_resale_click }
                                        price_preset = { props.calc.resale_price }
                                        price_type = 'resale'
                                        />
            </div>
            <ManualPriceInput   handle_submit = { props.update_price }/>
        </div>
    ]
}

function PresetPriceButtonUI(props){
    return <button class="button-primary-hollow" onClick={ props.handle_click }>{ props.price_type } ({ format_money(parseFloat(props.price_preset)) })</button>
}

function ManualPriceInput(props){
    const [customPrice, setCustomPrice] = React.useState('');

    function handle_change(e){
        setCustomPrice(e.target.value);
    }

    function handle_submit(){
        props.handle_submit(customPrice);
    }

    return <ManualPriceInputUI  custom_price = { customPrice }
                                handle_change = { handle_change }
                                handle_submit = { handle_submit }
                                />
}

function ManualPriceInputUI(props){
    return [
        <div class="combo-input-and-button">
            <span>Or enter your own and submit</span>
            <input type="number" step={0.01} name='new_price' value={ props.custom_price } onChange={ props.handle_change }></input>
            <SubmitButton submit={ props.handle_submit } />
        </div>
    ]
}