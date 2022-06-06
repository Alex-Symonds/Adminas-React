// JobItems section, plus functions to build a <select> based on id/name data from the server, plus a generic <li>qty x name</li>

function JobItems(props){
    const [formVisible, setFormVisible] = React.useState(props.items_data.length == 0);


    return [
        <section id="job_items_section" class="job-section">
            <h3>Items</h3>
            <div class="job-items-container">
                <JobItemsAddButton  form_visible = {formVisible} />
                <JobItemsAddForm    form_visible = {formVisible}
                                    URL_GET_DATA = {props.URL_GET_DATA}
                                    job_id = {props.job_id} />
                <JobItemsExisting   items_data = {props.items_data}
                                    currency={props.currency}
                                    URL_GET_DATA = {props.URL_GET_DATA}
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
    // Exit early if the form isn't needed at present
    if(!props.form_visible){
        return null;
    }

    // Setup states for the CRUD URL and the initial formset.
    const [urlAction, setUrlAction] = React.useState('');
    const [inputFields, setFields] = React.useState([
        {quantity: '', product_id: '', selling_price: '', price_list_id: ''}
    ]);

    // Fetch the URL for CRUD operations from the server
    const { data, error, isLoaded } = useFetch(url_for_url_list(props.URL_GET_DATA, props.job_id));
    React.useEffect(() => {
        if(typeof data.items_url !== 'undefined'){
            setUrlAction(data.items_url);
        }
    }, [data]);

    // Form-related constants. These will be used later to make sure the user doesn't go crazy adding/removing forms.
    const MIN_FORMS = 0;
    const MAX_FORMS = 1000;


    if(error){
        return <div>Error loading documents.</div>
    }
    else if (!isLoaded){
        return <div>Loading...</div>
    }
    return [
        <div id="new_items_container" class="form-like panel">
            <button id="close_item_form_btn" class="close"><span>close</span></button>
            <h5 class="panel-header">Add New Items</h5>
            <form method="POST" action={urlAction} id="items_form">
                <input type="hidden" name="form-TOTAL_FORMS" value={inputFields.length} id="id_form-TOTAL_FORMS" />
                <input type="hidden" name="form-INITIAL_FORMS" value="0" id="id_form-INITIAL_FORMS" />
                <input type="hidden" name="form-MIN_NUM_FORMS" value="0" id="id_form-MIN_NUM_FORMS" />
                <input type="hidden" name="form-MAX_NUM_FORMS" value="1000" id="id_form-MAX_NUM_FORMS" />
        
                {inputFields.map((data, index) =>
                    <JobItemsAddFormRow     key = {index}
                                            form_index = {index}
                                            URL_GET_DATA = {props.URL_GET_DATA}
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

// JobItems Add form: one "row" (i.e. if the user is adding multiple items at once, this would have fields for one new item)
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
                                    is_required = {false}
                                    api_url = {props.URL_GET_DATA}
                                    get_param = 'products'
                                    selected_opt_id = {props.data.product_id}
                                    default_opt_id = {null} />

            <label for={id_prefix + 'selling_price'}>Selling Price</label>
            <input type="number" name={prefix + 'selling_price'} step="0.01" id={id_prefix + 'selling_price'} value={props.data.selling_price}/>

            <label for={id_prefix + 'price_list'}>Price List</label>
            <SelectBackendOptions   select_id = {id_prefix + 'price_list'}
                                    select_name = {prefix + 'price_list'}
                                    is_required = {false}
                                    api_url = {props.URL_GET_DATA}
                                    get_param = 'price_lists'
                                    selected_opt_id = {props.data.price_list_id}
                                    default_opt_id = {null} />

            <input type="hidden" name={prefix + 'job'} value={props.job_id} id={id_prefix + 'job'} />
        </div>
    ]
}


// Section containing all the existing JobItems. The "main bit".
function JobItemsExisting(props){
    // Exit early if there are no items.
    if(props.items_data.length == 0){
        return null;
    }

    return [
        <div class="existing-items-container">
            {
                props.items_data.map((data) =>
                <JobItemEle key = {data.ji_id.toString()}
                            data = {data}
                            currency = {props.currency}
                            job_id = {props.job_id} 
                            URL_GET_DATA = {props.URL_GET_DATA} />
                )
            }
        </div>
    ]
}

function JobItemEle(props){
    return [
        <div id={'jobitem_' + props.data.ji_id} class="panel job-item-container">
            <JobItemHeading data = {props.data}/>
            <JobItemMoney   data = {props.data}
                            currency = {props.currency}/>
            <JobItemAccessories     data = {props.data} />
            <JobItemChildModules    data = {props.data}
                                    job_id = {props.job_id}
                                    URL_GET_DATA = {props.URL_GET_DATA} />
            <JobItemAssignments     data = {props.data} />
        </div>
    ]
}

function JobItemHeading(props){
    return [
        <h5 class="panel-header what">
            <span class="quantity">{ props.data.quantity }</span> x <span class="product">{ props.data.part_number }: { props.data.product_name }</span><span class="id-number">{ props.data.ji_id }</span>
            <div class="desc">{props.data.description}</div>
        </h5>
    ]
}

function JobItemMoney(props){
    var selling_price = parseFloat(props.data.selling_price);
    return [
        <div class="money">
            <span class="currency">{ props.currency }</span><span class="selling_price">{format_money(selling_price)}</span>
            <span class="price_list secondary-icon">{props.data.price_list.name}</span>
            <button class="ji-edit edit-icon" data-jiid={props.data.jiid} ><span>edit</span></button>
        </div>
    ]
}

function JobItemAccessories(props){
    if(props.data.standard_accessories.length == 0){
        return null;
    }

    var clarify_each_for_multiple = props.data.quantity > 1 ? '(in total)' : '';

    return [
        <div class="std-accs-container">
            <div class="std-accs">
                <p>Included accessories {clarify_each_for_multiple}</p>
                <ul>
                    {
                        props.data.standard_accessories.map((std_acc, index) =>
                            <QuantityNameLi         key = {index}
                                                    quantity = {std_acc.quantity}
                                                    name = {std_acc.product_name} />
                        )
                    }
                </ul>
            </div>
        </div>
    ]
}

function JobItemChildModules(props){
    if(!props.data.is_modular){
        return null;
    }

    var css_module_status = job_item_module_status_css(props.data);
    var heading_display_str = job_item_module_title_str(props.data);
    return [
        <div class={'module-status-section subsection modules-' + css_module_status}>
            <div class="intro-line">
                <span class="display-text">&raquo;&nbsp;{heading_display_str}</span>
                <LinkToModuleManagement     URL_GET_DATA = {props.URL_GET_DATA}
                                            job_id = {props.job_id}
                                            ji_id = {props.data.ji_id} />
            </div>
            <ul class="details">
                {
                    props.data.module_list.map((mod) => 
                        <QuantityNameLi     key = {mod.module_id.toString()}
                                            quantity = {mod.quantity}
                                            name = {mod.name} />
                    )
                }
            </ul>
        </div>
    ]
}

function LinkToModuleManagement(props){
    // Get the link to module management from the server
    const [url, setUrl] = React.useState('');
    const { data, error, isLoaded } = useFetch(url_for_url_list(props.URL_GET_DATA, props.job_id));
    React.useEffect(() => {
        if(typeof data.module_management_url !== 'undefined'){
            setUrl(data.module_management_url);
        }
    }, [data]);


    if(error || !isLoaded){
        return null;
    }
    return <a href={url + '#modular_jobitem_' + props.ji_id} class="edit-icon"><span>edit</span></a>
}

function job_item_module_status_css(data){
    if(data.excess_modules){
        return 'excess';
    }
    else if(data.is_complete){
        return 'ok';
    }
    return 'incomplete';
}

function job_item_module_title_str(data){
    var result = 'Specification';
    if(data.excess_modules){
        result = 'Special ' + result;
    }
    if(data.quantity > 1){
        result += ' (per' + nbsp() + 'item)';
    }
    if(!data.is_complete){
        result += ' ---' + nbsp() + 'WARNING:' + nbsp() + 'INCOMPLETE' + nbsp() + '---';
    }
    return result;
}

function JobItemAssignments(props){
    if(props.data.assignments.length == 0){
        return null;
    }
    return [
        <div class="module-status-section assignments">
            <div class="intro-line">
                <span class="display-text">
                    &laquo; Assignment
                </span>
                <JobItemAssignmentsCounter  display_str='used'
                                            num = {props.data.num_assigned}
                                            total = {props.data.total_product_quantity} />
                <JobItemAssignmentsCounter  display_str='unused'
                                            num = {props.data.total_product_quantity - props.data.num_assigned}
                                            total = {props.data.total_product_quantity} />
            </div>
            <ul>
                {
                    props.data.assignments.map((a, index) => 
                        <JobItemAssignmentLi    key = {index}
                                                data = {a}/>
                    )
                }
            </ul>
        </div>
    ]
}

function JobItemAssignmentsCounter(props){
    return [
        <div class="assignment-icon">
            <span class="label">{props.display_str}</span>
            <span class="status">{props.num}/{props.total}</span>
        </div>
    ]
}

function JobItemAssignmentLi(props){
    var each = props.data.parent_qty > 1 ? 'each ' : '';
    return [
        <li>{props.data.quantity } {each}to {props.data.parent_qty} x [{props.data.part_num}] {props.data.product_name} <span class="id-number">{props.data.parent_id}</span></li>
    ]
}




