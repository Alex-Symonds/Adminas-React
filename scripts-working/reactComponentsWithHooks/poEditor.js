/* 
    PO Editor
    || Hook
    || Components
*/

// || Hook
function usePOEditor(closeFn, poData, onSubmit, onDelete){
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

    const controlled = {
        'reference': getter_and_setter(reference, update_reference),
        'date_on_po': getter_and_setter(dateOnPo, update_date_on_po),
        'date_received': getter_and_setter(dateReceived, update_date_received),
        'currency': getter_and_setter(currency, update_currency),
        'po_value': getter_and_setter(poValue, update_po_value)
    }

    // Functions for handling form buttons
    const asyncHelper = useAsyncWithError(closeFn);

    function handle_submit(e){
        e.preventDefault();
        asyncHelper.handleAsync(onSubmit(state_to_object_fe(), state_to_object_be()));
    }

    function handle_delete(e){
        e.preventDefault();
        asyncHelper.handleAsync(onDelete());
    }

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
            job: window.JOB_ID
        };   
    }

    return {
        backend_error: asyncHelper.asyncError,
        controlled,
        handle_delete,
        handle_submit,
    }
}



// || Components
function JobPoEditor({ closeFn, data, form_id, onDelete, onSubmit, title }){
    const {
        backend_error,
        controlled,
        handle_delete,
        handle_submit,
    } = usePOEditor(closeFn, data, onSubmit, onDelete);

    return  <JobPoEditorUI   
                backend_error = { backend_error }
                closeFn = { closeFn }
                controlled = { controlled }
                form_id = { form_id }
                po_id = { data.po_id }
                handle_delete = { handle_delete }
                handle_submit = { handle_submit }
                title = { title }
            />
}

function JobPoEditorUI({ backend_error, controlled, closeFn, form_id, handle_delete, handle_submit, po_id, title }){
    const ID_REFERENCE = 'id_po_reference';
    const ID_DATE_ON_PO = 'id_date_on_po';
    const ID_DATE_RECEIVED = 'id_po_date_received';
    const ID_CURRENCY = 'id_po_currency';
    const ID_VALUE = 'id_po_value';

    return [
        <Modal close={ closeFn }>
            <div className={"poEditor"}>
                <h3 class="modal_heading">{ title }</h3>
                <div className={"modal_contents"}>
                { backend_error.message ?
                    <ErrorWithClearUI 
                        message = { backend_error.message }
                        clear = { backend_error.clear } 
                    />
                    : null
                }
                    <form class="poEditor_form formy" id={ form_id }>
                        <div className={"formy_inputsContainer"}>
                            <LabelFieldContainer>
                                <FormLabel inputID={ID_REFERENCE}>
                                    Customer PO Number:
                                </FormLabel>
                                <input 
                                    className={"poEditor_poNumInput formy_input"} 
                                    type="text" 
                                    name="reference" 
                                    maxlength="50" 
                                    required="" 
                                    id={ID_REFERENCE} 
                                    value={ controlled.reference.get } 
                                    onChange={ controlled.reference.set }
                                />
                            </LabelFieldContainer>
                            <LabelFieldContainer>
                                <FormLabel inputID={ID_DATE_ON_PO}>
                                    Date on PO:
                                </FormLabel>
                                <input 
                                    className={"formy_date"} 
                                    type="date" 
                                    name="date_on_po" 
                                    required="" 
                                    id={ID_DATE_ON_PO} 
                                    value={ controlled.date_on_po.get } 
                                    onChange={ controlled.date_on_po.set }
                                />
                            </LabelFieldContainer>
                            <LabelFieldContainer>
                                <FormLabel inputID={ID_DATE_RECEIVED}>
                                    Date received:
                                </FormLabel>
                                <input 
                                    className={"formy_date"} 
                                    type="date" 
                                    name="date_received" 
                                    required="" 
                                    id={ID_DATE_RECEIVED} 
                                    value={ controlled.date_received.get }
                                    onChange={ controlled.date_received.set } 
                                />
                            </LabelFieldContainer>
                            <LabelFieldContainer>
                                <FormLabel inputID={ID_CURRENCY}>
                                    Currency:
                                </FormLabel>
                                <SelectBackendOptions   
                                    cssClass={"formy_currencySelect"} 
                                    get_param = 'currencies'
                                    handle_change = { controlled.currency.set }
                                    is_required = {true}
                                    select_id = { ID_CURRENCY }
                                    select_name = { 'currency' }
                                    selected_opt_id = { controlled.currency.get }
                                />
                            </LabelFieldContainer>
                            <LabelFieldContainer>
                                <FormLabel inputID={ID_VALUE}>
                                    Value:
                                </FormLabel>
                                <input 
                                    className={"formy_input"} 
                                    type="number" 
                                    name="value" 
                                    step="0.01" 
                                    required="" 
                                    id={ID_VALUE} 
                                    value={ controlled.po_value.get }
                                    onChange={ controlled.po_value.set }
                                />
                            </LabelFieldContainer>
                        </div>
                        <EditorControls 
                            handleSubmit = { handle_submit }
                            handleDelete = { handle_delete }
                            wantDelete = { po_id !== null } 
                        />
                    </form>
                </div>
            </div>
        </Modal>
    ]
}