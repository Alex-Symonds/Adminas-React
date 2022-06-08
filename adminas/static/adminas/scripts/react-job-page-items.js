// JobItems section
// Includes:
//      JobItems formset for adding new items
//      Standard display of JobItems
//      

function JobItems(props){
    const [formVisible, setFormVisible] = React.useState(null);

    return [
        <section id="job_items_section" class="job-section">
            <h3>Items</h3>
            <div class="job-items-container">
                <JobItemsAddButton  form_visible = {formVisible}
                                    update_form_vis = {setFormVisible} />
                <JobItemsAddForm    form_visible = {formVisible}
                                    update_form_vis = {setFormVisible}
                                    URL_GET_DATA = {props.URL_GET_DATA}
                                    job_id = {props.job_id} />
                <JobItemsExisting   items_data = {props.items_data}
                                    currency={props.currency}
                                    URL_GET_DATA = {props.URL_GET_DATA}
                                    job_id = {props.job_id} />
            </div>
        </section>
    ]
}

function JobItemsAddButton(props){
    if(props.form_visible){
        return null;
    }
    function show_form(){
        props.update_form_vis(true);
    };
    return <button id="open_item_form_btn" class="add-button" onClick={show_form}>Add Items</button>
}

function JobItemsAddForm(props){
    // Form visibility handling
    if(props.form_visible === null || !props.form_visible){
        return null;
    }
    function hide_form(){
        props.update_form_vis(false);
    };

    // Setup states for the CRUD URL and handling the formset.
    const [urlAction, setUrlAction] = React.useState('');
    const [numToAdd, setNumToAdd] = React.useState(null);
    const [inputFields, setFields] = React.useState([
        blank_field_set()
    ]);

    // Fetch the URL for CRUD operations from the server
    const { data, error, isLoaded } = useFetch(url_for_url_list(props.URL_GET_DATA, props.job_id));
    React.useEffect(() => {
        if(typeof data.items_url !== 'undefined'){
            setUrlAction(data.items_url);
        }
    }, [data]);

    // Handling adding/removing extra items to the form
    const MAX_FORMS = 1000;

    function add_field_set(e){
        e.preventDefault();
        if(inputFields.length >= MAX_FORMS){
            return;
        }
        setFields([...inputFields, blank_field_set()]);
    }

    function add_n_field_sets(e){
        e.preventDefault();
        if(numToAdd === null){
            return;
        }
        var new_fields = [];
        var counter = 0;
        while(counter < numToAdd){
            new_fields.push(blank_field_set());
            counter++;
        }
        
        setFields(inputFields.concat(new_fields));
        setNumToAdd(null);
    }

    function remove_field_set(e, index){
        e.preventDefault();
        setFields(inputFields.filter((o, i) => i !== index));
    }

    function blank_field_set(){
        return {quantity: '', product_id: '', selling_price: '', price_list_id: ''};
    }

    function handle_num_add_change(e){
        var num = e.target.value;
        if(num < 0){
            setNumToAdd(null);
        }
        setNumToAdd(num);
    }



    // Rendering
    if(error){
        return <LoadingErrorEle name='form' />
    }
    else if (!isLoaded){
        return <LoadingEle />
    }
    return [
        <div id="new_items_container" class="form-like panel">
            <button id="close_item_form_btn" class="close" onClick={hide_form}><span>close</span></button>
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
                                            job_id = {props.job_id}
                                            num_forms = {inputFields.length}
                                            remove_field_set = {remove_field_set} />
                )}

                <button id="add_item_btn" class="add-button" onClick={(e) => add_field_set(e)}><span>add 1 more</span></button>
                <div class="add-multiple">
                    add <input type="number" id="add_multi_items" value={numToAdd} onChange={handle_num_add_change}/> more
                    <button id="add_multi_items_btn" class="button-primary" onClick={(e) => add_n_field_sets(e)}>ok</button>
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
            <JobItemsAddFormRowRemoveButton num_forms={props.num_forms}
                                            form_index = {props.form_index}
                                            remove_field_set = {props.remove_field_set} />

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

function JobItemsAddFormRowRemoveButton(props){
    // Ideally we don't want users to remove the last form from the formset, so if this is the last
    // form, exclude the convenient "remove" button.
    if(props.num_forms === 1){
        return null;
    }
    return <button class="remove-item-btn delete-panel" onClick={(e) => props.remove_field_set(e, props.form_index)}><span>remove</span></button>
}


// Section containing all the existing JobItems. The "main bit".
function JobItemsExisting(props){
    // Exit early if there are no items.
    if(props.items_data.length == 0){
        return null;
    }

    var product_slot_assignments = slot_assignment_data_by_product(props.items_data);

    return [
        <div class="existing-items-container">
            {
                props.items_data.map((data) =>
                <JobItemEle key = {data.ji_id.toString()}
                            data = {data}
                            currency = {props.currency}
                            job_id = {props.job_id} 
                            URL_GET_DATA = {props.URL_GET_DATA}
                            product_slot_data = {product_slot_assignments[data.product_id.toString()]} />
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
            <JobItemAssignments     data = {props.data}
                                    product_slot_data = {props.product_slot_data} />
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

    // If we don't have the url for any reason, don't display anything
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
    if(props.product_slot_data.assignments.length === 0){
        return null;
    }

    return [
        <div class="module-status-section assignments">
            <div class="intro-line">
                <span class="display-text">
                    &laquo; Assignment
                </span>
                <JobItemAssignmentsCounter  display_str='used'
                                            num = {props.product_slot_data.num_assigned}
                                            total = {props.product_slot_data.total_product_quantity} />
                <JobItemAssignmentsCounter  display_str='unused'
                                            num = {props.product_slot_data.total_product_quantity - props.product_slot_data.num_assigned}
                                            total = {props.product_slot_data.total_product_quantity} />
            </div>
            <ul>
                {
                    props.product_slot_data.assignments.map((a, index) => 
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
            <span class="status">{props.num}{props.display_str === 'used' ? "/" + props.total : ""}</span>
        </div>
    ]
}

function JobItemAssignmentLi(props){
    var each = props.data.parent_qty > 1 ? 'each ' : '';
    return [
        <li>{props.data.quantity } {each}to {props.data.parent_qty} x [{props.data.part_num}] {props.data.product_name} <span class="id-number">{props.data.parent_id}</span></li>
    ]
}



// Product-based slot assignments: rearrange "by JobItem" slot assignment information to be "by Product" instead
function slot_assignment_data_by_product(item_list){
    var products = get_products_list_no_assignments(item_list);
    return populate_products_list_with_assignments(products, item_list);
}

// Product-based slot assignments, first pass: create an object containing multiple nested objects, one for each unique product.
// Use product_id as the key for fast lookup and set total_product_quantity as you go.
function get_products_list_no_assignments(item_list){
    var result = {};

    for(var idx in item_list){
        var this_item = item_list[idx];
        var prod_id_as_str = this_item.product_id.toString();

        // If the product doesn't exist yet in result, add it now
        if(!(prod_id_as_str in result)){
            result[prod_id_as_str] = {
                num_assigned: 0,
                total_product_quantity: 0,
                assignments: []
            };
        }

        // Update num_total to take this_item into account
        result[prod_id_as_str].total_product_quantity += parseInt(this_item.quantity);
    }
    return result;
}

// Products: set "assignments" and "num_assigned" by checking all the module_lists in item_list
function populate_products_list_with_assignments(result, item_list){
    for(var pidx in item_list){
        var parent = item_list[pidx];
        if(parent.module_list != null && parent.module_list.length > 0){

            for(var midx in parent.module_list){
                var child_prod_id_as_str = parent.module_list[midx].product_id.toString();
                
                // If there is no field in result for the child at this stage, something went wrong
                if(!(child_prod_id_as_str in result)){
                    console.log('ERR: Products[] creation, missing product');
                    break;
                }
                // Update the child product's "num_assigned" and "assignments".
                else{
                    // Modules store quantities on a "per parent item" basis, so multiply by parent.quantity to get the total
                    var total_used = parent.module_list[midx].quantity * parent.quantity;
                    result[child_prod_id_as_str].num_assigned += total_used;

                    // Setup an object with all the data needed to display this assignment under the child item
                    var assignment = {
                        quantity: total_used,
                        parent_qty: parent.quantity,
                        part_num: parent.part_number,
                        product_name: parent.product_name,
                        parent_id: parent.ji_id
                    };

                    result[child_prod_id_as_str].assignments.push(assignment);
                }
            }
        }
    }
    return result;
}



