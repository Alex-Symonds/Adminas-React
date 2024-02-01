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

    return  <JobPriceCheckUI 
                actions_items = { props.actions_items }
                currency = { props.currency }
                has_invalid_currency_po = { props.has_invalid_currency_po } 
                items_list = { props.items_list }
                job_id = { props.job_id }
                price_accepted_state = { props.price_accepted_state}
                total_selling = { props.total_selling }
                total_list = { total_items_list_price }
                URL_GET_DATA = { props.URL_GET_DATA }
            />
}

function JobPriceCheckUI(props){
    let contents;
    if(props.items_list.length == 0){
        contents = <JobPriceCheckEmptyUI   is_empty = { props.items_list.length == 0 }/>;
    }
    else {
        contents = [
            <PriceAcceptanceToggle  job_id = { props.job_id }
                                    price_accepted_state = { props.price_accepted_state }
                                    URL_GET_DATA = { props.URL_GET_DATA }
                                    />,
            <WarningSubsection      message = { `The figures below assume all item selling prices are in the job currency, ${ props.currency }. If a selling price is actually in a different currency, the numbers will be inaccurate.` }
                                    show_warning = { props.has_invalid_currency_po } 
                                    title = "Caution: PO Currency Mismatch"
                                    />,
            <JobPriceCheckSummaryUI     currency = { props.currency }
                                        total_selling = { props.total_selling }
                                        total_list = { props.total_list }
                                        />,
            <JobPriceCheckDetails       actions_items = { props.actions_items }
                                        currency = { props.currency }
                                        items_list = { props.items_list }
                                        />
        ]
    }

    return [
        <section id="price_check_section" class="jobPriceCheck jobNarrowSection">
            <JobSectionHeadingNarrowUI text={"Prices"} />
            { contents }
        </section>
    ]
}




function JobPriceCheckEmptyUI(props){
    if(!props.is_empty){
        return null;
    }
    return <EmptySectionUI  message={"Activates upon entering items"} css={'jobPage_emptySection jobNarrowSection_content'} />
}

// || Price acceptance toggle
function PriceAcceptanceToggle(props){
    const {
        error,
        isLoaded,
        toggle_acceptance,
    } = usePriceAcceptanceToggle(props.URL_GET_DATA, props.job_id, props.price_accepted_state);


    if(error){
        return <LoadingErrorUI name='price acceptance toggle' />
    }
    else if (!isLoaded){
        return <LoadingUI />
    }
    return <PriceAcceptanceToggleUI 
                is_accepted = { props.price_accepted_state.get }
                toggle_acceptance = { toggle_acceptance } 
            />
}

function PriceAcceptanceToggleUI(props){
    var css_class = props.is_accepted ? 'on' : 'off';
    var display_text = props.is_accepted ? 'accepted' : 'NOT ACCEPTED';
    return [
        <div id="price_confirmation_status" className={"jobNarrowSection_content"}>
            <div class={'status-indicator ' + css_class}>
                <span class="status-name">selling price is</span>
                <button id="price_confirmation_button" onClick={ props.toggle_acceptance }>{ display_text }</button>
            </div>
        </div>
    ]
}


function usePriceAcceptanceToggle(URL_GET_DATA, job_id, price_accepted_state){
    const [url, setUrl] = React.useState(null);
    const { data, error, isLoaded } = useFetch(url_for_url_list(URL_GET_DATA, job_id))
    React.useEffect(() => {
        set_if_ok(data, 'price_acceptance_url', setUrl);
    }, [data]);

    function toggle_acceptance(){
        if(url === null){
            return;
        }

        let is_accepted_now = !price_accepted_state.get;
        var headers = getFetchHeaders('PUT', {
            'new_status': is_accepted_now
        });

        update_server(`${url}?job_id=${job_id}`, headers, resp_data => {
            if(status_is_good(resp_data, 204)){
               price_accepted_state.set(is_accepted_now);
            }
            else {
                alert(`Error: ${get_error_message(resp_data)}`);
            }
        });
    }

    return {
        error,
        isLoaded,
        toggle_acceptance,
    }
}


// || Comparison table wrapper
function JobPriceCheckSummaryUI(props){
    return [
        <div class="subsection jobPriceCheckComparison jobNarrowSection_content">
            <h4>Comparison to List Price</h4>
            <PriceComparisonTable   
                currency = { props.currency }
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
    const editor_state = getter_and_setter(activeEdit, setActiveEdit);

    return [
        <div class="subsection jobPriceCheckDetails jobNarrowSection_content">
            <h4>Details</h4>
            <div class="subsection_contentWrapper">
                <table id="price_check_table" class="banded">
                    <JobPriceCheckDetailsTableHeadUI    
                        currency = { props.currency } 
                    />
                    <JobPriceCheckDetailsTableBodyUI    
                        actions_items = { props.actions_items }
                        editor_state = { editor_state }
                        items_list = { props.items_list }
                    />
                </table>
            </div>
        </div>
    ]
}

function JobPriceCheckDetailsTableHeadUI(props){
    return [
        <thead>
            <tr class="upper-h-row">
                <th colspan={4}></th>
                <th colspan={4}>vs. Price List ({ props.currency })</th>
                <th colspan={4}>vs. Resale ({ props.currency })</th>
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

   return [
        <td class="description">
            <span class="details-toggle" onClick={ toggle_name }>{props.data.part_number}</span>
            { showName ?
                <span class="details">{ props.data.product_name }</span>
                : null
            }
        </td>
   ] 
}


// Selling price <td>, with the price editor
function JobPriceCheckDetailsSellingPrice(props){

    // In the event of a backend error, the plan is to close the editor
    // and display the error in "read mode", so the state has been pushed up to here
    const [backendError, setBackendError] = React.useState(null);
    const backend_error = get_backend_error_object(backendError, setBackendError);

    return [
        <td class="selling-price-container">
            <BackendErrorUI message = { backend_error.message }
                            turn_off_error = { backend_error.clear } />
            <span class="selling-price">{ format_money(props.calc.selling_price) }</span>
            <JobPriceCheckEditButtonUI  editor = { props.editor } />
            <JobPriceCheckPriceEditor   
                editor = { props.editor }
                calc = { props.calc }
                data = { props.data }
                update_item = { props.update_item }
                url_with_id = { props.url_with_id }
                backend_error = { backend_error }
             />
        </td>
    ]
}


function JobPriceCheckEditButtonUI(props){
    return  <button 
                class="edit-btn edit-icon" 
                onClick={ props.editor.on }
                disabled={ props.editor.active_id !== null }
                >
                <span>edit</span>
            </button>
}


// || Price check editor
function JobPriceCheckPriceEditor(props){
    if(!props.editor.is_active){
        return null;
    }

    const {
        handle_list_click,
        handle_resale_click,
        update_price,
    } = priceCheckEditorKit(props.calc, props.url_with_id, props.update_item, props.editor, props.backend_error);

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
        <div class="priceCheckEditor panel popout">
            <CancelButton cancel = { props.cancel }/>
            <h5 class="panel-header">Edit Price</h5>
            <p className={"priceCheckEditor_description"}>{props.data.quantity} x [{ props.data.part_number }] { props.data.product_name }</p>
            <div class="priceCheckEditor_optionsContainer">
                <h6 className={"priceCheckEditor_optionsHeading"}>Click new price</h6>
                <PresetPriceButtonUI    
                    handle_click = { props.handle_list_click }
                    price_preset = { props.calc.list_price }
                    price_type = 'list'
                />
                <PresetPriceButtonUI    
                    handle_click = { props.handle_resale_click }
                    price_preset = { props.calc.resale_price }
                    price_type = 'resale'
                />
            </div>
            <ManualPriceInput   handle_submit = { props.update_price }/>
        </div>
    ]
}

function PresetPriceButtonUI(props){
    return <button class="priceCheckEditor_presetPriceButton button-primary-hollow" onClick={ props.handle_click }>{ props.price_type } ({ format_money(parseFloat(props.price_preset)) })</button>
}


function ManualPriceInput(props){
    const {
        customPrice,
        handle_change,
        handle_submit
    } = useManualPriceInput(props.handle_submit);

    return [
        <form class="priceCheckEditor_customPrice singleInputWithButton">
            <label 
                className={"singleInputWithButton_label"} 
                htmlFor={"id_new_price"} 
            >
                Or enter your own and submit
            </label>
            <input 
                className={"singleInputWithButton_input"} 
                id={"id_new_price"} 
                type="number" 
                step={0.01} 
                name='new_price' 
                value={ customPrice } 
                onChange={ handle_change } 
            />
            <SubmitButton 
                submit={ handle_submit } 
                cssClasses={"singleInputWithButton_submit formControls_submit"} 
            />
        </form>
    ]
}


function useManualPriceInput(submitFn){
    const [customPrice, setCustomPrice] = React.useState('');

    function handle_change(e){
        setCustomPrice(e.target.value);
    }

    function handle_submit(){
        submitFn(customPrice);
    }

    return {
        customPrice,
        handle_change,
        handle_submit
    }
}

// function ManualPriceInputUI(props){
//     return [
//         <form class="combo-input-and-button">
//             <label htmlFor={"id_new_price"} >Or enter your own and submit</label>
//             <input id={"id_new_price"} type="number" step={0.01} name='new_price' value={ props.custom_price } onChange={ props.handle_change } />
//             <SubmitButton submit={ props.handle_submit } />
//         </form>
//     ]
// }


function priceCheckEditorKit(calc, url_with_id, update_item, editor, backend_error){
    // Update backend and state for the new selling price
    function handle_list_click(){
        update_price(calc.list_price);
    }
    function handle_resale_click(){
        update_price(calc.resale_price);
    }

    function update_price(new_price){
        const new_attributes = {
            selling_price: new_price
        }
        const headers = getFetchHeaders('PUT', new_attributes);

        update_server(url_with_id, headers, resp_data => {
            if(status_is_good(resp_data, 204)){
                update_item(new_attributes);
                editor.off();
            }
            else {
                backend_error.set(get_error_message(resp_data));
                editor.off();
            }
        });
    }

    return {
        handle_list_click,
        handle_resale_click,
        update_price,
    }
}