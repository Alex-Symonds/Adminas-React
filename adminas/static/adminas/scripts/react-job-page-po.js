// PO section on the Job page

// Entire PO section
function JobPo(props){
    const [formVisible, setFormVisible] = React.useState(null);

    return [
        <section id="job_po_section" class="item">
            <h3>Purchase Orders</h3>
            <div class="job-po-form-container">
                <JobPoAddButton     form_vis = {formVisible}
                                    update_form_vis = {setFormVisible} />
                <JobPoAddNew        form_vis = {formVisible}
                                    update_form_vis = {setFormVisible}
                                    job_id =  {props.job_id}
                                    URL_GET_DATA = {props.URL_GET_DATA}
                                    currency = {props.currency} />
            </div>
            <JobPoDiscrepancy   currency = {props.currency}
                                data = {props.po_data}
                                num_po = {props.po_list.length} />
            <JobPoList          currency = {props.currency} 
                                po_list = {props.po_list}
                                URL_GET_DATA = { props.URL_GET_DATA }
                                job_id = {props.job_id}
                                update_po = { props.update_po }
                                delete_po = { props.delete_po } />
        </section>
    ]
}

// Button to click to open the form to add one PO to the Job
function JobPoAddButton(props){
    if(props.form_vis){
        return null;
    }
    function show_form(){
        props.update_form_vis(true);
    }
    return [
        <button id="toggle_po_form_btn" class="add-button" onClick={show_form}>New PO</button>
    ]
}

// Form for adding a shiny new PO to the Job
function JobPoAddNew(props){
    // Exit early if it's not wanted
    if(props.form_vis === null || !props.form_vis){
        return null;
    }
    function hide_form(){
        props.update_form_vis(false);
    }

    // Fetch the action URL for Purchase Order form from server
    const [actionUrl, setActionUrl] = React.useState('');
    const { data, error, isLoaded } = useFetch(url_for_url_list(props.URL_GET_DATA, props.job_id));
    React.useEffect(() => {
        if(typeof data.po_url !== 'undefined'){
            setActionUrl(data.po_url);
        }
    }, [data]);

    // Display
    if(error){
        return <LoadingErrorEle name='form' />
    }
    else if(!isLoaded){
        return <LoadingEle />
    }

    // Actual form has its own component, for easy sharing with Edit PO
    return <JobPoEditor URL_ACTION = { actionUrl }
                        URL_GET_DATA = { props.URL_GET_DATA }
                        form_id = 'po_form'
                        cancel = { hide_form }
                        title = 'Add PO'
                        reference = {null}
                        date_on_po = {null}
                        date_received = {null}
                        currency = {props.currency}
                        value = {null}
                        job_id = {props.job_id}
                        />
}

// PO editor form
function JobPoEditor(props){
    const [reference, setReference] = React.useState(props.reference);
    const [dateOnPo, setDateOnPo] = React.useState(props.date_on_po);
    const [dateReceived, setDateReceived] = React.useState(props.date_received);
    const [currency, setCurrency] = React.useState(props.currency);
    const [poValue, setPoValue] = React.useState(props.value);

    function update_reference(e){
        setReference(e.target.value);
    }
    function update_date_on_po(e){
        setDateOnPo(e.target.value);
    }
    function update_date_received(e){
        setDateReceived(e.target.value);
    }
    function update_currency(select_ele){
        setCurrency(select_ele.value);
    }
    function update_po_value(e){
        setPoValue(e.target.value);
    }

    function handle_submit(e){
        e.preventDefault();
        var form_obj = {
            reference: reference,
            date_on_po: dateOnPo,
            value: poValue,
            date_received: dateReceived,
            currency: currency
        };
        props.handle_submit(form_obj);
        props.cancel();
    }

    return [
        <form class="form-like panel" id={props.form_id} onSubmit={handle_submit}>
            <button type="button" class="cancel-po-form close" onClick={props.cancel}><span>cancel</span></button>
            <h5 class="panel-header">{ props.title }</h5>

            <label for="id_reference">Customer PO Number:</label>
            <input type="text" name="reference" maxlength="50" required="" id="id_reference" value={ reference } onChange={update_reference}/>
            <label for="id_date_on_po">Date on PO:</label>
            <input type="date" name="date_on_po" required="" id="id_date_on_po" value={ dateOnPo } onChange={update_date_on_po}/>
            <label for="id_date_received">Date received:</label>
            <input type="date" name="date_received" required="" id="id_date_received" value={ dateReceived } onChange={update_date_received} />
            <label for="id_currency">Currency:</label>
            <SelectBackendOptions   select_id = {'id_currency'}
                                    select_name = {'currency'}
                                    is_required = {true}
                                    api_url = {props.URL_GET_DATA}
                                    get_param = 'currencies'
                                    selected_opt_id = {currency}
                                    default_opt_id = {null}
                                    handle_change = {update_currency} />
            <label for="id_value">Value:</label><input type="number" name="value" step="0.01" required="" id="id_value" value={poValue} onChange={update_po_value}/>
            <input type="hidden" name="job" value={props.job_id} id="id_job" />
            <div class="controls">
                <input type='submit' action='submit' id='po_submit_button' value='submit' class='button-primary' />
            </div>
        </form>
    ]
}




// Subsection showing the difference between total PO value and total line items value. Conditionally displayed when there's a mismatch with prices.
function JobPoDiscrepancy(props){
    if(props.data.difference === 0 || props.num_po === 0){
        return null;
    }

    return [
        <div class="po-discrepancy warning subsection">
            <h4>Discrepancy</h4>
            <p>Sum of PO values does not match sum of line item selling prices.</p>
            <div class="subsection">
                <h5 class="subsection-heading">Comparison: Items to PO</h5>
                <PriceComparisonTable   currency = {props.currency}
                                        difference = {props.data.difference}
                                        first_title = 'PO Sum'
                                        first_value = {props.data.total_po_value}
                                        second_title = 'Line Items Sum'
                                        second_value = {props.data.total_items_value}
                                        />
            </div>
        </div>
    ]
}




// Actual list of POs
function JobPoList(props){
    if(props.po_list.length === 0){
        return <p class="empty-section-notice">No purchase orders have been entered.</p>
    }

    // manage edit mode: only one PO should be editable at a time
    const [activeEdit, setActiveEdit] = React.useState(null);

    return [
        <div class="job-po-container">
            {props.po_list.map((po) =>
                <JobPoElement   key = {po.po_id.toString()}
                                currency = {props.currency}
                                data = {po}
                                job_id = {props.job_id}
                                active_edit = { activeEdit }
                                update_active_edit = { setActiveEdit }
                                URL_GET_DATA = { props.URL_GET_DATA }
                                update_po = { props.update_po }
                                delete_po = { props.delete_po } />
            )}
        </div>
    ]
}
function JobPoElement(props){
    function hide_form(){
        props.update_active_edit(null);
    }

    function handle_edit(po_attributes){
        props.update_po(props.data.po_id, po_attributes);
    }

    // If edit mode is active, display the form (form has its own component, for easy sharing with Add PO)
    if(props.active_edit === props.data.po_id){
        return <JobPoEditor URL_ACTION = { null }
                            URL_GET_DATA = { props.URL_GET_DATA }
                            form_id = 'po_edit_form'
                            cancel = { hide_form }
                            title = 'Edit PO'
                            reference = { props.data.reference }
                            date_on_po = { props.data.date_on_po }
                            date_received = { props.data.date_received }
                            currency = { props.data.currency }
                            value = { props.data.value }
                            job_id = { props.job_id }
                            handle_submit = { handle_edit }
                        />
    }

    // Otherwise show the read-mode
    return <JobPoRead   currency = {props.currency}
                        data = {props.data}
                        update_active_edit = { props.update_active_edit } />
}

// Element for reading info of a single PO
function JobPoRead(props){
    return [
        <div class="po-row">
            <div class="details">
                <span class="reference">{props.data.reference}</span> dated <span class="date_on_po">{props.data.date_on_po}</span> for <span class="currency">{props.currency}</span> <span class="value">{props.data.value}</span> (received <span class="date_received">{format_money(props.data.date_received)}</span>)
                <button type="button" class="po-edit edit-icon" data-po={props.data.po_id} onClick={() => props.update_active_edit(props.data.po_id)}><span>edit</span></button>
            </div>
        </div>
    ]
}




