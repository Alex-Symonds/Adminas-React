

function JobItems(props){
    // Make these states
    const form_visible = true; // initialise this to {props.items_count == 0}

    return [
        <section id="job_items_section" class="job-section">
            <h3>Items</h3>
            <div class="job-items-container">
                <JobItemsAddButton form_visible = {form_visible} />
                <JobItemsAddForm    form_visible = {form_visible}
                                    job_id = {props.job_id}/>
            </div>
        </section>
    ]
}

function JobItemsAddButton(props){
    if(props.form_visible){
        return null;
    }
    return <button id="open_item_form_btn" class="add-button">Add Items</button>
}

function JobItemsAddForm(props){
    const URL_ITEMS = '/items';

    const MIN_FORMS = 0;    // use these to check whether to add another form if the user indicates they want one more
    const MAX_FORMS = 1000;

    // states --------------------------
    var total_forms = 1;
    var input_fields = [
        {quantity: '', product_id: 0, selling_price: '', price_list_id: 0}
    ];
    // ---------------------------------


    if(!props.form_visible){
        return null;
    }

    return [
        <div id="new_items_container" class="form-like panel">
            <button id="close_item_form_btn" class="close"><span>close</span></button>
            <h5 class="panel-header">Add New Items</h5>
            <form method="POST" action={URL_ITEMS} id="items_form">
                <input type="hidden" name="form-TOTAL_FORMS" value={total_forms} id="id_form-TOTAL_FORMS" />
                <input type="hidden" name="form-INITIAL_FORMS" value="0" id="id_form-INITIAL_FORMS" />
                <input type="hidden" name="form-MIN_NUM_FORMS" value="0" id="id_form-MIN_NUM_FORMS" />
                <input type="hidden" name="form-MAX_NUM_FORMS" value="1000" id="id_form-MAX_NUM_FORMS" />
        
                {input_fields.map((data, index) =>
                    <JobItemsAddFormRow     key = {index}
                                            form_index = {index}
                                            data = {data}
                                            job_id = {props.job_id} />
                )}

                <button id="add_item_btn" class="add-button"><span>add 1 more</span></button>
                <div class="add-multiple">
                    add <input type="number" id="add_multi_items" /> more
                    <button id="add_multi_items_btn" class="button-primary">ok</button>
                </div>
                <input type="submit" action="submit" id="items_submit_button" class="button-primary full-width-button" value="submit"></input>
            </form>
        </div>
    ]
}

function JobItemsAddFormRow(props){
    var prefix = 'form-' + props.form_index + '-';
    var id_prefix = 'id_' + prefix;

    return [
        <div class="form-row panel">
            <button class="remove-item-btn delete-panel"><span>remove</span></button>

            <label for={id_prefix + 'quantity'}>Quantity</label>
            <input type="number" name={prefix + 'quantity'} id={id_prefix + 'quantity'} value={props.data.quantity}/>

            <label for={id_prefix + 'product'}>Item</label>
            <SelectBackendOptions   select_id = {id_prefix + 'product'}
                                    select_name = {prefix + 'product'}
                                    get_param = 'products_all'
                                    selected_opt_id = {props.data.product_id}
                                    default_opt_id = {null} />

            <label for={id_prefix + 'selling_price'}>Selling Price</label>
            <input type="number" name={prefix + 'selling_price'} step="0.01" id={id_prefix + 'selling_price'} value={props.data.selling_price}/>

            <label for={id_prefix + 'price_list'}>Price List</label>
            <SelectBackendOptions   select_id = {id_prefix + 'price_list'}
                                    select_name = {prefix + 'price_list'}
                                    get_param = 'price_lists'
                                    selected_opt_id = {props.data.price_list_id}
                                    default_opt_id = {null} />

            <input type="hidden" name={prefix + 'job'} value={props.job_id} id={id_prefix + 'job'} />
        </div>
    ]
}




function SelectBackendOptions(props){
    
    // TODO: add a fetch that uses props.get_param to request a list of ID numbers and display text from Django
    var option_list = [
        {id: 1, name: "Test thingy"},
        {id: 2, name: "Another test thingy"}
    ];

    return [
        <select name={props.select_name} id={props.select_id}>
            <OptionEmptyDefault default_id = {props.default_id} selected_opt_id = {props.selected_opt_id}/>
            {
                option_list.map((option) => {
                    var is_selected =   option.id == props.selected_opt_id
                                    ||
                                    (   props.selected_opt_id == 0
                                        &&
                                        option.id == props.default_id
                                    );

                    return <OptionIdAndName         key = {option.id.toString()}
                                                    id = {option.id}
                                                    name = {option.name}
                                                    is_selected = {is_selected}
                                                    />
                })
            }
        </select>
    ]
}

function OptionEmptyDefault(props){
    if(props.default_id != null){
        return null;
    }

    if(props.selected_opt_id != 0){
        return <option value="" disabled>---------</option>
    }

    return <option value="" selected disabled>---------</option>
}

function OptionIdAndName(props){
    if(props.is_selected){
        return <option value={props.id} selected>{props.name}</option>
    }
    return <option value={props.id}>{props.name}</option>
}