/*
    Summary:
    PO section on the Job page

    Contents:
        || Main PO section
        || Create PO section
        || Discrepancy Warning
        || Existing POs
        || PO editor form
*/

// || Main section
function JobPo(props){
    return [
        <section id="job_po_section" class="job-section">
            <h3>Purchase Orders</h3>
            <JobPoCreate    
                actions_po = { props.actions_po }
                currency = { props.currency }
                job_id =  { props.job_id }
                URL_GET_DATA = {props.URL_GET_DATA}
            />
            <WarningSubsection  
                message = "All POs should be in the same currency as the job."
                show_warning = { props.has_invalid_currency_po }
                title = "Error: Currency Mismatch"
            />
            <JobPoDiscrepancyUI 
                currency = { props.currency}
                difference = { props.difference }
                poList = { props.poList }
                total_po_value = { props.total_po_value }
                total_items_value = { props.total_items_value }
            />
            <JobPoList          
                actions_po = { props.actions_po }
                currency = { props.currency } 
                poList = { props.poList }
                job_id = { props.job_id }
                URL_GET_DATA = { props.URL_GET_DATA }
            />
        </section>
    ]
}


// || Create PO section
function JobPoCreate(props){
    // Either the button or the form should be visible, never both.
    // Use an editor object to monitor this, allowing reuse of code with that called by components
    // monitoring multiple competing children.
    const [activeEdit, setActiveEdit] = React.useState(null);
    const editor = get_editor_object('create_po_form', activeEdit, setActiveEdit);

    return [
        <div class="job-po-form-container">
            <button 
                id="toggle_po_form_btn" 
                class="add-button" 
                onClick={ editor.on }
                disabled = { editor.is_active }
            >
                New PO
            </button>
            <JobPoAddNew        
                actions_po = { props.actions_po }
                currency = { props.currency }
                editor = { editor }
                job_id =  { props.job_id }
                URL_GET_DATA = {props.URL_GET_DATA}
            />
        </div>
    ]
}


// "Create mode" wrapper for the JobPoEditor
function JobPoAddNew(props){
    if(!props.editor.is_active){
        return null;
    }

    // JobPoEditor is shared with the Update/Delete form
    // It requires the parent to pass in functions to "handle_submit" and "handle_delete"
    // on the frontend. Make submit = create.
    function handle_submit(new_po_id, po_attributes){
        props.actions_po.create_f(new_po_id, po_attributes);
    }

    // Make a "blank" data object for passing into the editor
    const data = {
        'po_id': null,
        'currency': props.currency,
        'date_on_po': null,
        'date_received': null,
        'reference': null,
        'value': null
    }

    return <JobPoEditor data = { data }
                        editor = { props.editor }
                        form_id = 'po_form'
                        state_submit = { handle_submit }
                        state_delete = { null }
                        job_id = { props.job_id }
                        title = 'Add PO'
                        URL_GET_DATA = { props.URL_GET_DATA }
                        />
}



// || Discrepancy Warning
// Subsection showing the difference between total PO value and total line items value. Conditionally displayed when there's a mismatch with prices.
function JobPoDiscrepancyUI(props){
    if(props.difference === 0 || props.poList.length === 0){
        return null;
    }

    return [
        <div class="po-discrepancy warning subsection">
            <h4>Discrepancy</h4>
            <p>Sum of PO values does not match sum of line item selling prices.</p>
            <div class="subsection">
                <h5 class="subsection_heading">Comparison: Items to PO</h5>
                <PriceComparisonTable   
                    currency = {props.currency}
                    difference = {props.difference}
                    first_title = 'PO Sum'
                    first_value = {props.total_po_value}
                    second_title = 'Line Items Sum'
                    second_value = {props.total_items_value}
                />
            </div>
        </div>
    ]
}



// || Existing POs
// Container to hold the elements for each individual PO
function JobPoList(props){
    if(props.poList.length === 0){
        return <EmptySectionUI message='No purchase orders have been entered.' />
    }

    // manage edit mode: only one PO should be editable at a time
    const [activeEdit, setActiveEdit] = React.useState(null);
    const editor_state = getter_and_setter(activeEdit, setActiveEdit);

    return <JobPoListUI 
                poList = { props.poList }
                actions_po = { props.actions_po }
                currency = { props.currency }
                editor_state = { editor_state }
                job_id = { props.job_id }
                URL_GET_DATA = { props.URL_GET_DATA }
            />
}

function JobPoListUI(props){
    return [
        <div class="job-po-container">
            <table id="po_table" class="banded">
                <thead>
                    <tr>
                        <th>Reference</th>
                        <th>Date on PO</th>
                        <th>Received</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
            {props.poList.map((po) =>
                <JobPoElement   key = { po.po_id.toString() }
                                actions_po = { props.actions_po }
                                currency = { props.currency }
                                data = { po }
                                editor_state = { props.editor_state }
                                job_id = { props.job_id }
                                URL_GET_DATA = { props.URL_GET_DATA }
                                />
            )}
                </tbody>
            </table>
        </div>
    ]
}


// Element displaying info for a single PO
function JobPoElement(props){

    const editor = get_editor_object(props.data.po_id, props.editor_state.get, props.editor_state.set);

    // JobPoEditor is shared with the Update/Delete form
    // It requires the parent to pass in functions to "handle_submit" and "handle_delete"
    // on the frontend. Make submit = update and delete = ... well, delete.
    function handle_edit(po_attributes){
        props.actions_po.update_f(props.data.po_id, po_attributes);
    }

    function handle_delete(){
        props.actions_po.delete_f(props.data.po_id);
    }

    // If edit mode is active, display the editor while passing in the data for this PO
    if(editor.is_active){
        return [
            <tr>
                <td colspan={5}>
                    <JobPoEditor 
                        data = { props.data }
                        editor = { editor }
                        form_id = 'po_edit_form'
                        state_delete = { handle_delete }
                        state_submit = { handle_edit }
                        job_id = { props.job_id }
                        title = 'Edit PO'
                        URL_GET_DATA = { props.URL_GET_DATA }
                    />
                </td>
            </tr>
        ]
    }

    // Otherwise show the read-mode
    return <JobPoReadUI 
                currency = {props.currency}
                data = {props.data}
                editor = { editor } 
            />
}


// Element for reading info of a single PO
function JobPoReadUI(props){
    let currency_matches_job = props.data.currency === props.currency;

    return [
        <tr class={currency_matches_job ? null : "invalid"}>
            <td class="ref">{ props.data.reference }</td>
            <td class="date_on_po">{ props.data.date_on_po }</td>
            <td class="date_received">{ props.data.date_received }</td>
            <td class="value">
                <InvalidIconUI  is_valid = { currency_matches_job }
                                message = "job has different currency"
                                />
                <span class="display-text">{ props.data.currency + nbsp() + format_money(parseFloat(props.data.value)) }</span>
            </td>
            <td class="edit"><button type="button" class="po-edit edit-icon" onClick={ props.editor.on }><span>edit</span></button></td>
        </tr>
    ]
}


// || PO editor form
// Shared by CREATE and UPDATE/DELETE
function JobPoEditor(props){
    const {
        error,
        isLoaded,
        backend_error,
        controlled,
        handle_delete,
        handle_submit,
    } = usePOEditor(props.data, props.URL_GET_DATA, props.state_submit, props.state_delete, props.editor);

    if(error){
        return <LoadingErrorUI name='form' />
    }
    else if(!isLoaded){
        return <LoadingUI />
    }
    return  <JobPoEditorUI   
                backend_error = { backend_error }
                editor = { props.editor }
                controlled = { controlled }
                form_id = { props.form_id }
                po_id = { props.data.po_id }
                handle_delete = { handle_delete }
                handle_submit = { handle_submit }
                title = { props.title }
                URL_GET_DATA = { props.URL_GET_DATA }
            />
}


function JobPoEditorUI(props){
    const ID_REFERENCE = 'id_po_reference';
    const ID_DATE_ON_PO = 'id_date_on_po';
    const ID_DATE_RECEIVED = 'id_po_date_received';
    const ID_CURRENCY = 'id_po_currency';
    const ID_VALUE = 'id_po_value';

    return [
        <Modal close={props.editor.off}>
            <div className={"poEditor"}>
                <h3 class="modal_heading">{ props.title }</h3>
                <div className={"modal_contents"}>
                    <BackendErrorUI 
                        message = { props.backend_error.message }
                        turn_off_error = { props.backend_error.clear } 
                    />

                    <form class="poEditor_form formy" id={ props.form_id }>
                        <div className={"formy_inputsContainer"}>
                            <LabelFieldContainer>
                                <FormLabel inputID={ID_REFERENCE}>
                                    Customer PO Number:
                                </FormLabel>
                                <input className={"poEditor_poNumInput formy_input"} type="text" name="reference" maxlength="50" required="" id={ID_REFERENCE} value={ props.controlled.reference.get } onChange={ props.controlled.reference.set }/>
                            </LabelFieldContainer>
                            <LabelFieldContainer>
                                <FormLabel inputID={ID_DATE_ON_PO}>
                                    Date on PO:
                                </FormLabel>
                                <input className={"formy_date"} type="date" name="date_on_po" required="" id={ID_DATE_ON_PO} value={ props.controlled.date_on_po.get } onChange={ props.controlled.date_on_po.set }/>
                            </LabelFieldContainer>
                            <LabelFieldContainer>
                                <FormLabel inputID={ID_DATE_RECEIVED}>
                                    Date received:
                                </FormLabel>
                                <input className={"formy_date"} type="date" name="date_received" required="" id={ID_DATE_RECEIVED} value={ props.controlled.date_received.get } onChange={ props.controlled.date_received.set } />
                            </LabelFieldContainer>
                            <LabelFieldContainer>
                                <FormLabel inputID={ID_CURRENCY}>
                                    Currency:
                                </FormLabel>
                                <SelectBackendOptions   
                                    select_id = { ID_CURRENCY }
                                    select_name = { 'currency' }
                                    is_required = {true}
                                    api_url = { props.URL_GET_DATA }
                                    get_param = 'currencies'
                                    selected_opt_id = { props.controlled.currency.get }
                                    handle_change = { props.controlled.currency.set }
                                    cssClass={"formy_currencySelect"} 
                                />
                            </LabelFieldContainer>
                            <LabelFieldContainer>
                                <FormLabel inputID={ID_VALUE}>
                                    Value:
                                </FormLabel>
                                <input className={"formy_input"} type="number" name="value" step="0.01" required="" id={ID_VALUE} value={ props.controlled.po_value.get } onChange={ props.controlled.po_value.set }/>
                            </LabelFieldContainer>
                        </div>
                        <EditorControls 
                            submit = { props.handle_submit }
                            delete = { props.handle_delete }
                            want_delete = { props.po_id !== null } 
                        />
                    </form>
                </div>
            </div>
        </Modal>
    ]
}


function usePOEditor(poData, URL_GET_DATA, state_submit, state_delete, editor){
    const [reference, setReference] = React.useState(poData.reference);
    const [dateOnPo, setDateOnPo] = React.useState(poData.date_on_po);
    const [dateReceived, setDateReceived] = React.useState(poData.date_received);
    const [currency, setCurrency] = React.useState(poData.currency);
    const [poValue, setPoValue] = React.useState(poData.value);

    function update_reference(e){
        setReference(e.target.value);
    }
    function update_date_on_po(e){
        setDateOnPo(e.target.value);
    }
    function update_date_received(e){
        setDateReceived(e.target.value);
    }
    function update_currency(e){
        setCurrency(e.target.value);
    }
    function update_po_value(e){
        setPoValue(e.target.value);
    }

    var controlled = {
        'reference': getter_and_setter(reference, update_reference),
        'date_on_po': getter_and_setter(dateOnPo, update_date_on_po),
        'date_received': getter_and_setter(dateReceived, update_date_received),
        'currency': getter_and_setter(currency, update_currency),
        'po_value': getter_and_setter(poValue, update_po_value)
    }

    // Fetching the URL for purchase order actions from the BE
    const [actionUrl, setActionUrl] = React.useState('');
    const { data, error, isLoaded } = useFetch(url_for_url_list(URL_GET_DATA));
    React.useEffect(() => {
        set_if_ok(data, 'po_url', setActionUrl);
    }, [data]);

    // Functions for handling form buttons
    function handle_submit(e){
        e.preventDefault();
        save_po();  
    }

    function handle_delete(e){
        e.preventDefault();
        delete_po();
    }

    const [backendError, setBackendError] = React.useState(null);
    const backend_error = get_backend_error_object(backendError, setBackendError);

    const save_po = () => {
        if(poData.po_id === null){
            save_po_on_be('POST', 201, actionUrl, (resp_data) => {
                var attributes = state_to_object_fe();
                attributes.po_id = resp_data.id;
                state_submit(attributes);
            });

        } else {
            save_po_on_be('PUT', 204, `${actionUrl}?id=${poData.po_id}`, () => {
                state_submit(state_to_object_fe());
            });
        }
    };

    function save_po_on_be(method, expected_response_code, url, update_po_state_funct){
        const headers = getFetchHeaders(method, state_to_object_be());

        update_server(url, headers, resp_data => {
            if(status_is_good(resp_data, expected_response_code)){
                update_po_state_funct(resp_data);
                editor.off();
            }
            else{
                backend_error.set(get_error_message(resp_data));
            }
        });
    }


    const delete_po = () => {
        const url = `${actionUrl}?id=${poData.po_id}`;
        const headers = getFetchHeaders('DELETE', null);

        update_server(url, headers, resp_data => {
            if(status_is_good(resp_data, 204)){
                state_delete();
                editor.off();
            }
            else{
                backend_error.set(get_error_message(resp_data));
            }
        });
    };

    function state_to_object_fe(){
        return {
            reference: reference,
            date_on_po: dateOnPo,
            value: poValue,
            date_received: dateReceived,
            currency: currency
        };   
    }

    function state_to_object_be(){
        return {
            reference: reference,
            date_on_po: dateOnPo,
            value: poValue,
            date_received: dateReceived,
            currency: currency,
            job: props.job_id
        };   
    }

    return {
        error,
        isLoaded,
        backend_error,
        controlled,
        handle_delete,
        handle_submit,
    }
}


