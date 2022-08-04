/*
    Summary:
    Items section on the Job page

    Contents:
        || Main section
        || JobItem General Formatting
            > IDs and price lists
        || Button to hide/show the create form
        || Existing Table
            > Includes helper functions to rearrange item_list slot assignments to be product-centric
        || Details
            > Includes the section component and helper functions relating to details selection
        || JobItem Reader
        || Product
        || JobItems Creator
        || JobItem Editor
        || Shared form fields (by Creator -- via its children -- and Editor)
*/

// These are used for handling the existing items table's "details" panels
const SELECTED_PARENT = 'parent';
const SELECTED_CHILD = 'child';
const SELECTED_SIBLING = 'sibling';

const CSS_HIGHLIGHTED_TD = 'content-highlight-wrapper';

// || Main section
function JobItems(props){

    // Setup the create form as an editor
    const [activeEdit, setActiveEdit] = React.useState(null);
    const editor = get_editor_object('create_items_form', activeEdit, setActiveEdit);

    return <JobItemsUI  actions_items = { props.actions_items }
                        currency = { props.currency }
                        editor = { editor }
                        items_list = {props.items_list}
                        job_id = { props.job_id }
                        URL_GET_DATA = { props.URL_GET_DATA }
                        URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                        />
}

function JobItemsUI(props){
    return [
        <section id="job_items_section" class="job-section">
            <h3>Items</h3>
            <div class="job-items-container">
                <JobItemsCreatorButtonUI    editor = { props.editor } />
                <JobItemsCreator    actions_items = { props.actions_items }
                                    editor = { props.editor }
                                    job_id = { props.job_id }
                                    URL_GET_DATA = { props.URL_GET_DATA }
                                    />
                <JobItemsExisting   actions_items = { props.actions_items }
                                    currency = { props.currency }
                                    items_list = {props.items_list}
                                    job_id = {props.job_id}
                                    URL_GET_DATA = {props.URL_GET_DATA}
                                    URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                                    />
            </div>
        </section>
    ]
}

// || JobItem General Formatting
function WarningMessageSpan(props){
    if(props.message === null){
        return null;
    }
    return <span class="warning-msg"><span class="invalid-icon"></span><span class="msg">{ props.message }</span></span>
}

// || Button to hide/show the create form
function JobItemsCreatorButtonUI(props){
    if(props.editor.is_active){
        return null;
    }

    return <button id="open_item_form_btn" class="add-button" onClick={ props.editor.on }>Add Items</button>
}

// || Existing
// Section containing all the existing JobItems, both as a table listing them and as "details" panels
function JobItemsExisting(props){
    // Exit early if there are no items.
    if(props.items_list.length == 0){
        return <EmptySectionUI message='No items have been entered.' />
    }

    // Manage edit state (i.e. only one JobItem can be edited at a time)
    const [activeEdit, setActiveEdit] = React.useState(null);
    const editor_state = get_and_set(activeEdit, setActiveEdit);

    // Manage details state (i.e. only one JobItem can have details viewed at a time)
    const [activeDetails, setActiveDetails] = React.useState(null);
    const details_state = get_and_set(activeDetails, setActiveDetails);
    const details_parent = get_details_parent(activeDetails, props.items_list);

    // Products
    // item_list is a JobItem-centric list, which contains info about which products are assigned to each  
    // JobItem's slots. This is good for the Specification section, but some parts of this page need the opposite: 
    // a product-centric list, containing info about which JobItems refer to each product and to which
    // JobItem/s the product has been assigned. Derive that from item_list here.
    var product_slot_assignments = slot_assignment_data_by_product(props.items_list);
    
    return <JobItemsExistingUI  actions_items = { props.actions_items }
                                currency = {props.currency}
                                details_parent = { details_parent }
                                details_state = { details_state }
                                editor_state = { editor_state }
                                items_list = { props.items_list }
                                job_id = {props.job_id}
                                product_slot_assignments = { product_slot_assignments }
                                URL_GET_DATA = {props.URL_GET_DATA}
                                URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                                />
}

function JobItemsExistingUI(props){
    return [
        <div class="existing-items-container">
            <JobItemsExistingTable  actions_items = { props.actions_items }
                                    currency = {props.currency}
                                    details_items_list = { props.details_items_list }
                                    details_parent = { props.details_parent }
                                    details_state = { props.details_state }
                                    editor_state = { props.editor_state }
                                    items_list = { props.items_list }
                                    job_id = {props.job_id}
                                    product_slot_assignments = { props.product_slot_assignments }
                                    URL_GET_DATA = {props.URL_GET_DATA}
                                    URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                                    />
            <JobItemsDetailsContainer   actions_items = { props.actions_items }
                                        currency = {props.currency}
                                        details_parent = { props.details_parent }
                                        details_state = { props.details_state }
                                        editor_state = { props.editor_state }
                                        job_id = {props.job_id}
                                        product_slot_assignments = { props.product_slot_assignments }
                                        URL_GET_DATA = {props.URL_GET_DATA}
                                        URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                                        />
        </div>
    ]
}

// Existing: Table
function JobItemsExistingTable(props){
    const css_class = props.details_parent === null ? 'banded' : 'details-visible';

    return [
        <table id="jobitems_table" class={css_class}>
            <JobItemsExistingTableHeadUI currency = { props.currency } />
            <JobItemsExistingTableBodyUI    actions_items = { props.actions_items }
                                            currency = {props.currency}
                                            details_items_list = { props.details_items_list }
                                            details_parent = { props.details_parent }
                                            details_state = { props.details_state }
                                            editor_state = { props.editor_state }
                                            items_list = { props.items_list }
                                            job_id = {props.job_id}
                                            product_slot_assignments = { props.product_slot_assignments }
                                            URL_GET_DATA = {props.URL_GET_DATA}
                                            URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }/>
        </table>
    ]
}

function JobItemsExistingTableHeadUI(props){
    return [
        <thead>
            <tr>
                <th>id</th>
                <th>qty</th>
                <th>part #</th>
                <th>name</th>
                <th>modular</th>
                <th>sold @ {props.currency}</th>
                <th>price list</th>
            </tr>
        </thead>
    ]
}

function JobItemsExistingTableBodyUI(props){
    return [
        <tbody>
        {
            props.items_list.map((data) =>
            <JobItemRow key = {data.ji_id.toString()}
                        actions_items = { props.actions_items }
                        currency = {props.currency}
                        data = { data }
                        details_parent = { props.details_parent }
                        details_state = { props.details_state }
                        editor_state = { props.editor_state }
                        job_id = {props.job_id}
                        product_slot_data = { props.product_slot_assignments[data.product_id.toString()] }
                        URL_GET_DATA = {props.URL_GET_DATA}
                        URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                        />
            )
        }
        </tbody>
    ]
}

function JobItemRow(props){
    // Adjust which jobItem is selected for details
    function toggle_details(){
        if(props.details_state.get === props.data.ji_id){
            props.details_state.set(null);
            document.activeElement.blur();
        }
        else {
            props.details_state.set(props.data.ji_id);
        }
    }

    const details_selection_status = get_details_selection_status(props.data, props.details_parent);

    return <JobItemRowUI    currency = { props.currency }
                            data = { props.data }
                            details_selection_status = { details_selection_status }
                            product_slot_data = { props.product_slot_data }
                            toggle_details = { toggle_details }
                            URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                            />
}


function JobItemRowUI(props){
    const tr_css = get_details_css_class(props.details_selection_status);
    const dark_icon_css = props.details_selection_status === SELECTED_PARENT ? ' dark' : '';
    const no_modules_css = props.data.is_modular ? '' : ' not-modular';

    return [
        <tr class={tr_css}>
            <td class="ji_id">
                <div class={CSS_HIGHLIGHTED_TD}>
                    <JobItemIdIcon ji_id = { props.data.ji_id } />
                </div>
            </td>
            <td class="quantity">
                { props.data.quantity }
            </td>
            <td class="part_no">
                <div class={CSS_HIGHLIGHTED_TD}>
                    { props.data.part_number }
                </div>
            </td>
            <td class="product_name">
                { props.data.product_name }
            </td>
            <td class={"modular" + no_modules_css}>
                <JobItemRowModularContentsUI  data = { props.data }
                                        URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                                        />
            </td>
            <td class="selling_price">
                { format_money(parseFloat(props.data.selling_price)) }
            </td>
            <td class="price_list">
                <JobItemPriceListIconSpan price_list_name = { props.data.price_list_name }/>
            </td>

            <td class="more_info">
                <button class={"more-icon" + dark_icon_css} onClick={ props.toggle_details }><span>more info</span></button>
            </td>
        </tr>
    ]
}

function JobItemRowChildTdUI(props){
    let display_string = '';
    if(props.data.num_assigned > 0){
        const num_unassigned = props.data.total_product_quantity - props.data.num_assigned;
        display_string = `${ props.data.total_product_quantity } (${ props.data.num_assigned }:${ num_unassigned })`;
    }
    return <td class="assignments"><div class={CSS_HIGHLIGHTED_TD}>{ display_string }</div></td>
}

function JobItemRowModularContentsUI(props){
    if(!props.data.is_modular){
        return <div class={CSS_HIGHLIGHTED_TD}>-</div>
    }

    var css_suffix = job_item_module_status_css(props.data);
    var display_str = job_item_module_status_string(props.data);

    return <div class={CSS_HIGHLIGHTED_TD + ' modules-' + css_suffix}>{ display_str }</div>

}


// || Details
function JobItemsDetailsContainer(props){
    if(props.details_parent === null){
        return null;
    }

    function details_off(){
        props.details_state.set(null);
    }

    const [isExpanded, setIsExpanded] = React.useState(false);
    const expanded_state = get_and_set(isExpanded, setIsExpanded);

    const expanded_class = isExpanded ? " expanded" : "";
    return [
        <div class="jobitems-details">
            <CancelButton   cancel = { details_off } />
            <div class={"jobitems-details-container" + expanded_class}>
                <JobItem    actions_items = { props.actions_items }
                            currency = {props.currency}
                            data = { props.details_parent }
                            details_state = { props.details_state }
                            editor_state = { props.editor_state }
                            job_id = {props.job_id}
                            product_slot_data = { props.product_slot_assignments[props.details_parent.product_id.toString()] }
                            URL_GET_DATA = {props.URL_GET_DATA}
                            URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                            />
                { props.details_parent.module_list.map(mod =>
                        <JobItemProductUI   key = { String(mod.product_id) }
                                            currency = { props.currency }
                                            data = { props.product_slot_assignments[mod.product_id.toString()] }
                        />)
                }
            </div>
            <ExpandCollapseToggle   expanded_state = { expanded_state } />
        </div>
    ]
}

function ExpandCollapseToggle(props){
    const css_class = props.expanded_state.get ? "collapse" : "expand";
    const display_text = css_class;

    const toggle_to = !props.expanded_state.get;
    function handle_click(){
        props.expanded_state.set(toggle_to);
    }

    return <button class={"expand-collapse " + css_class } onClick={ handle_click }><span>{ display_text }</span></button>
}

function get_details_parent(parent_id, data){
    if(parent_id === null){
        return null;
    }

    var parent_index = data.findIndex(ele => ele['ji_id'] === parseInt(parent_id));
    if(parent_index === -1){
        return null;
    }

    return data[parent_index];
}

function get_details_selection_status(tr_data, details_parent){
    if(details_parent === null){
        return null;
    }

    if(details_parent.ji_id === tr_data.ji_id){
        return SELECTED_PARENT;
    }

    if(details_parent.product_id === tr_data.product_id){
        return SELECTED_SIBLING;
    }

    var index = details_parent.module_list.findIndex(ele => ele.product_id === tr_data.product_id);
    if(index === -1){
        return null;
    }

    return SELECTED_CHILD;
}

function get_details_css_class(selected_status){

    switch (selected_status){
        
        case SELECTED_PARENT:
            return 'details-active';
        
        case SELECTED_CHILD:
            return 'details-child';
        
        case SELECTED_SIBLING:
            return 'details-sibling';
        
        default:
            return null;
    }
}



// || JobItem: one individual JobItem 
// This adds some arguments to passed down functions and handles the "read or edit" logic
function JobItem(props){

    // Add the job_id argument to passed-down functions, so children don't need to worry about that detail.
    const editor = get_editor_object(props.data.ji_id, props.editor_state.get, props.editor_state.set);

    function delete_item(){
        props.actions_items.delete_f(props.data.ji_id);
    }

    // Edit mode display
    if(editor.is_active){
        return <JobItemEditor   data = {props.data}
                                delete_item = { delete_item }
                                editor = { editor }
                                job_id = { props.job_id }
                                update_item = { props.actions_items.update_f }
                                URL_GET_DATA = {props.URL_GET_DATA}
                                URL_ITEMS = { props.actions_items.url }
                                />
    }

    // Read mode display
    return <JobItemReaderUI 
                            currency = { props.currency }
                            data = { props.data }
                            editor = { editor }
                            job_id = {props.job_id}
                            product_slot_data = { props.product_slot_data }
                            URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                            />
}

// JobItem Reader
function JobItemReaderUI(props){
    return [
        <div class="job-item-container">
            <JobItemHeadingUI   
                                description = { props.data.description }
                                ji_id = { props.data.ji_id }
                                part_number = { props.data.part_number }
                                product_name = { props.data.product_name }
                                quantity = { props.data.quantity }
                                />
            <JobItemMoneyUI currency = { props.currency }
                            data = { props.data }
                            editor = { props.editor }
                            />
            <JobItemAccessoriesUI   data = { props.data } />
            <JobItemSpecificationUI data = { props.data }
                                    job_id = { props.job_id }
                                    URL_MODULE_MANAGEMENT = { props.URL_MODULE_MANAGEMENT }
                                    />
            <JobItemsProductMembers currency = { props.currency }
                                    data = { props.product_slot_data }
                                    exclude_id = { props.data.ji_id }
                                    title = { 'Product also entered as' }
                                    />
            <JobItemAssignmentsUI   product_slot_data = { props.product_slot_data } />
        </div>
    ]
}

// JobItemReader: subsection, also used for Products
function JobItemHeadingUI(props){
    return [
        <div class="subsection">
            <h5 class="subsection-heading what">
                <JobItemHeadingQuantitySpan  quantity = { props.quantity } />
                <span class="product">{ props.part_number }: { props.product_name }</span>
                <JobItemIdIcon  ji_id = { props.ji_id } />
                <div class="desc">{props.description}</div>
            </h5>
        </div>
    ]
}

function JobItemHeadingQuantitySpan(props){
    if(props.quantity === null){
        return null;
    }
    return <span class="quantity">{ props.quantity } x </span>
}

// JobItemReader: subsection
function JobItemMoneyUI(props){
    var selling_price = parseFloat(props.data.selling_price);
    return [
        <div class="money subsection">
            <span class="selling_price">{ props.currency + nbsp() +format_money(selling_price) }</span>
            <JobItemPriceListIconSpan price_list_name = { props.data.price_list_name } />
            <button class="ji-edit edit-icon" onClick={ props.editor.on }><span>edit</span></button>
        </div>
    ]
}

// JobItemReader: subsection
function JobItemAccessoriesUI(props){
    if(props.data.standard_accessories.length == 0){
        return null;
    }

    var clarify_each_if_multiple = props.data.quantity > 1 ? ' (in total)' : '';

    return [
        <div class="std-accs-container subsection">
            <div class="std-accs">
                <p>Included accessories{clarify_each_if_multiple}</p>
                <ul>
                    {
                        props.data.standard_accessories.map((std_acc, index) =>
                            <QuantityNameLi key = {index}
                                            name = {std_acc.product_name}
                                            quantity = {std_acc.quantity} />
                        )
                    }
                </ul>
            </div>
        </div>
    ]
}

// JobItemReader: subsection
function JobItemSpecificationUI(props){
    if(!props.data.is_modular){
        return null;
    }
    var css_module_status = job_item_module_status_css(props.data);
    var heading_display_str = job_item_module_title_str(props.data);
    const warning_message = props.data.is_complete ? null : 'incomplete'.toUpperCase();

    return [
        <div class={'module-status-section subsection modules-' + css_module_status}>
            <div class="intro-line">
                <span class="display-text">
                    &raquo;&nbsp;{heading_display_str} 
                </span>
                <WarningMessageSpan message = { warning_message } />
                <a href={props.URL_MODULE_MANAGEMENT + '#modular_jobitem_' + props.data.ji_id} class="edit-icon"><span>edit</span></a>
            </div>
            <ul class="details">
                {
                    props.data.module_list.map((mod) => 
                        <QuantityNameLi     key = {mod.module_id.toString()}
                                            name = {mod.name}
                                            quantity = {mod.quantity} />
                    )
                }
            </ul>
        </div>
    ]
}

// JobItemReader: JobItemSpecification helpers
// CSS class, based on specification status
function job_item_module_status_css(data){
    if(data.excess_modules){
        return 'excess';
    }
    if(data.is_complete){
        return 'ok';
    }
    return 'incomplete';
}

// Display text, based on specification status
function job_item_module_status_string(data){
    if(data.excess_modules){
        return 'special';
    }
    if(data.is_complete){
        return 'ok';
    }
    return 'invalid';
}

// Title, based on specification status and quantity
function job_item_module_title_str(data){
    var result = 'Specification';
    if(data.excess_modules){
        result = 'Special ' + result;
    }
    if(data.quantity > 1){
        result += ' (per' + nbsp() + 'item)';
    }
    return result;
}

// JobItemReader: subsection, also used for Products
function JobItemsProductMembers(props){
    // JobItem sections will pass in their own ji_id as "props.exclude_id": this should be removed from the list
    // Product sections will not, so use the full list
    const filtered_members = props.exclude_id === null ? props.data.members : props.data.members.filter(item => item.ji_id !== props.exclude_id);

    // If there are no (remaining) members, skip this section
    if(filtered_members.length === 0){
        return null;
    }

    return <JobItemsProductMembersUI    currency = { props.currency }
                                        members = { filtered_members }  
                                        title = { props.title }
                                        />

}

function JobItemsProductMembersUI(props){
    return [
        <div class="subsection product">
            <div class="subsection-heading">{ props.title }</div>
            <div class="ji-list">
                <table>
                    {
                        props.members.map(member =>
                            <JobItemsProductMembersRowUI    key = { member.ji_id.toString() }
                                                            currency = { props.currency }
                                                            data = { member }
                                                            />
                        )
                    }
                </table>
            </div>
        </div>
    ]
}

function JobItemsProductMembersRowUI(props){
    return [
        <tr>
            <td><JobItemIdIcon ji_id = { props.data.ji_id } /></td>
            <td class="desc">{ props.data.quantity } for { props.currency + nbsp() + format_money(parseFloat(props.data.selling_price) ) }</td>
            <td><JobItemPriceListIconSpan price_list_name = { props.data.price_list_name } /></td>
        </tr>
    ]
}


// JobItemReader: subsection, also used for Products
function JobItemAssignmentsUI(props){
    if(props.product_slot_data.assignments.length === 0){
        return null;
    }

    return [
        <div class="module-status-section assignments subsection">
            <div class="intro-line">
                <span class="display-text">
                    &laquo; Assignment
                </span>
                <div class="usage-counters">
                <JobItemAssignmentsCounterUI    display_str='used'
                                                num = {props.product_slot_data.num_assigned}
                                                total = {props.product_slot_data.total_product_quantity} />
                <JobItemAssignmentsCounterUI    display_str='unused'
                                                num = {props.product_slot_data.total_product_quantity - props.product_slot_data.num_assigned}
                                                total = {props.product_slot_data.total_product_quantity} />
                </div>
            </div>
            <ul>
                {
                    props.product_slot_data.assignments.map((a, index) => 
                        <JobItemAssignmentLiUI  key = {index}
                                                data = {a}/>
                    )
                }
            </ul>
        </div>
    ]
}

// JobItemReader: JobItemAssignments helper. One of the little "x/y used" thingies
function JobItemAssignmentsCounterUI(props){
    return [
        <div class="assignment-icon">
            <span class="label">{props.display_str}</span>
            <span class="status">{props.num}{props.display_str === 'used' ? "/" + props.total : ""}</span>
        </div>
    ]
}

// JobItemReader: JobItemAssignments helper. Display one assignment as an <li>
function JobItemAssignmentLiUI(props){
    var each = props.data.parent_qty > 1 ? 'each ' : '';
    return <li>{props.data.quantity } {each}to {props.data.parent_qty} x [{props.data.part_num}] {props.data.product_name} <span class="id-number">{props.data.parent_id}</span></li>
}

// JobItemReader: helper function
// Product-based info re. slot assignments. Rearrange "by JobItem" slot assignment information to be "by Product" instead
function slot_assignment_data_by_product(item_list){

    // Begin with an object containing all unique products on the Job (key = product_id)
    var result = initialise_products_list(item_list);

    // Update the products to include module slot assignment information
    for(var pidx in item_list){
        var parent = item_list[pidx];
        if(parent.module_list != null && parent.module_list.length > 0){
            for(var midx in parent.module_list){

                // If the product can't be found, something went wrong
                var product_key = parent.module_list[midx].product_id.toString();
                if(!(product_key in result)){
                    break;
                }
                // Update the product's "num_assigned" and "assignments".
                else{
                    // Modules store quantities on a "per parent item" basis, so multiply by parent.quantity to get the total
                    var total_used = parent.module_list[midx].quantity * parent.quantity;
                    result[product_key].num_assigned += total_used;

                    // Setup an object with all the data needed to display this assignment, then add it
                    var assignment = {
                        quantity: total_used,
                        parent_qty: parent.quantity,
                        part_num: parent.part_number,
                        product_name: parent.product_name,
                        parent_id: parent.ji_id
                    };
                    result[product_key].assignments.push(assignment);
                }
            }
        }
    }
    return result;
}


// JobItemReader: helper function
// Product-based slot assignments: create an object containing all unique products on the job with the product_id as the key
function initialise_products_list(item_list){
    var result = {};

    for(var idx in item_list){
        var this_item = item_list[idx];
        var prod_id_as_str = this_item.product_id.toString();

        // If the product doesn't exist yet in result, add it now
        if(!(prod_id_as_str in result)){
            result[prod_id_as_str] = {
                description: this_item.description,
                part_number: this_item.part_number,
                product_name: this_item.product_name,
                total_product_quantity: 0,
                num_assigned: 0,
                assignments: [],
                members: []
            };
        }

        // Update total_product_quantity to take this_item into account
        result[prod_id_as_str].total_product_quantity += parseInt(this_item.quantity);
        result[prod_id_as_str].members.push(this_item);  
    }
    return result;
}


// || Product
function JobItemProductUI(props){
    return [
        <div class="job-item-container product">
            <JobItemHeadingUI   description = { props.data.description }
                                ji_id = { null }
                                part_number = { props.data.part_number }
                                product_name = { props.data.product_name }
                                quantity = { null }
                            />
            <JobItemProductQuantityUI quantity = { props.data.total_product_quantity }/>
            <JobItemsProductMembers currency = { props.currency }
                                    data = { props.data }
                                    exclude_id = { null }
                                    title = { 'Entered as' }
                                    />
            <JobItemAssignmentsUI product_slot_data = { props.data } />  
        </div> 
    ]
}

function JobItemProductQuantityUI(props){
    return [
        <div class="subsection">
            <span class="product-quantity">Total quantity: { props.quantity }</span>
        </div>
    ]
}








// || JobItems Creator
// Add items form: state and backend functions for the formset
function JobItemsCreator(props){
    if(!props.editor.is_active){
        return null;
    }

    // Setup states for the formset.
    const [numToAdd, setNumToAdd] = React.useState(null);
    const [inputFields, setFields] = React.useState([
        blank_create_jobitem_object()
    ]);

    // State for handling response to backend updates
    const [backendError, setBackendError] = React.useState(null);
    const backend_error = get_backend_error_object(backendError, setBackendError);

    // Support for increasing/decreasing the number of items on the form
    const MAX_FORMS = 1000;
    function add_field_set(e){
        e.preventDefault();
        if(inputFields.length >= MAX_FORMS){
            return;
        }
        setFields([...inputFields, blank_create_jobitem_object()]);
    }

    function add_n_field_sets(e){
        e.preventDefault();
        if(numToAdd === null){
            return;
        }

        var new_fields = [];
        var counter = 0;
        while(counter < numToAdd){
            new_fields.push(blank_create_jobitem_object());
            counter++;
        }
        
        setFields(inputFields.concat(new_fields));
        setNumToAdd(null);
    }

    function handle_num_add_change(e){
        var num = e.target.value;
        if(num < 0){
            setNumToAdd(null);
        }
        setNumToAdd(num);
    }

    function remove_field_set(index){
        setFields(inputFields.filter((ele, i) => i !== index));
    }

    function update_fields(index, fld_attributes){
        setFields([
            ...inputFields.slice(0, index),
            Object.assign(inputFields[index], fld_attributes),
            ...inputFields.slice(index + 1)
        ]);
    }

    var actions_formset = {
        'add_one': add_field_set,
        'add_multiple': add_n_field_sets,
        'num_to_add': get_and_set(numToAdd, handle_num_add_change),
        'remove': remove_field_set,
        'update': update_fields
    }

    // Support for the submit button
    function handle_submit(e){
        e.preventDefault();
        create_new_items();
    }

    function create_new_items(){
        const url = props.actions_items.url;
        const headers = getFetchHeaders('POST', state_to_object_be());

        update_server(url, headers, resp_data => {
            if(status_is_good(resp_data, 201)){
                if(typeof resp_data.id_list !== 'undefined'){
                    add_new_items_to_state(resp_data.id_list);
                }
                else {
                    backend_error.set('Page refresh recommended.');
                }
            }
            else {
                backend_error.set(get_error_message(resp_data));
            }
        });
    }

    function add_new_items_to_state(id_list){
        const url = props.actions_items.url;
        const get_headers = getFetchHeaders('GET', null);

        let id_list_str = id_list.join('.');
        const get_url = `${url}?ji_id_list=${id_list_str}`;

        update_server(get_url, get_headers, resp_data => {
            if(status_is_good(resp_data, 200)){
                props.actions_items.create_f(resp_data.jobitems);
                props.editor.off();
            }
            else {
                backend_error.set(get_error_message(resp_data));
            }
        });
    }

    // Arrange the formset state info such that Django will understand it
    function state_to_object_be(){
        let obj = {
            'form-TOTAL_FORMS': `${inputFields.length}`,
            'form-INITIAL_FORMS': '0',
            'form-MIN_NUM_FORMS': '0',
            'form-MAX_NUM_FORMS': '50'
        }

        for(var index in inputFields){
            var item_form = inputFields[index];
            var prefix = `form-${index}-`;

            obj[prefix + 'quantity'] = item_form.quantity;
            obj[prefix + 'product'] = item_form.product_id;
            obj[prefix + 'selling_price'] = item_form.selling_price;
            obj[prefix + 'price_list'] = item_form.price_list_id;
            obj[prefix + 'job'] = props.job_id;
        }

        return obj;
    }

    // Rendering
    return <JobItemsCreatorUI   actions_formset = { actions_formset }
                                backend_error = { backend_error }
                                editor = { props.editor }
                                handle_submit = { handle_submit }
                                input_fields = { inputFields }
                                job_id = { props.job_id }
                                URL_GET_DATA = { props.URL_GET_DATA }
                                URL_ITEMS = { props.actions_items.url }
                                />
    
}

// Add items form: helper. Blank object, for use in initialising new additions to the formset
function blank_create_jobitem_object(){
    return {quantity: '', product_id: '', selling_price: '', price_list_id: ''};
}

// Add items form
function JobItemsCreatorUI(props){
    return [
        <div id="new_items_container" class="form-like panel">
            <button id="close_item_form_btn" class="close" onClick={ props.editor.off }><span>close</span></button>
            <h5 class="panel-header">Add New Items</h5>
            <BackendErrorUI message = { props.backend_error.message }
                            turn_off_error = { props.backend_error.clear } />

            <form id="items_form" onSubmit={ props.handle_submit }>
                <input type="hidden" name="form-TOTAL_FORMS" value={ props.input_fields.length } id="id_form-TOTAL_FORMS" />
                <input type="hidden" name="form-INITIAL_FORMS" value="0" id="id_form-INITIAL_FORMS" />
                <input type="hidden" name="form-MIN_NUM_FORMS" value="0" id="id_form-MIN_NUM_FORMS" />
                <input type="hidden" name="form-MAX_NUM_FORMS" value="50" id="id_form-MAX_NUM_FORMS" />
        
                {props.input_fields.map((data, index) =>
                    <JobItemsCreatorRow     key = { index }
                                            form_index = { index }
                                            actions_formset = { props.actions_formset}
                                            data = { data }
                                            job_id = { props.job_id }
                                            num_forms = { props.input_fields.length }
                                            URL_GET_DATA = { props.URL_GET_DATA }
                                            URL_ITEMS = { props.URL_ITEMS }
                                            />
                )}

                <button id="add_item_btn" class="add-button" onClick={ props.actions_formset.add_one }><span>add 1 more</span></button>
                <div class="add-multiple">
                    add <input type="number" id="add_multi_items" value={ props.actions_formset.num_to_add.get } onChange={ props.actions_formset.num_to_add.set }/> more
                    <button id="add_multi_items_btn" class="button-primary" onClick={ props.actions_formset.add_multiple }>ok</button>
                </div>
                <input type="submit" action="submit" id="items_submit_button" class="button-primary full-width-button" value="submit"></input>
            </form>

        </div>
    ]
}

// Create: one set of fields (i.e. if the user is adding multiple items at once, this would have fields for one new item)
function JobItemsCreatorRow(props){
    // Functions for handling controlled inputs
    // (States for these are in the parent, where they're stored under inputFields)
    function update_quantity(e){
        var attr = {quantity: e.target.value};
        update_formset_state(attr);
    }
    function update_selling_price(e){
        var attr = {selling_price: e.target.value};
        update_formset_state(attr);
    }
    function update_product(e){
        var attr = {product_id: e.target.value};
        update_formset_state(attr);
    }
    function update_price_list(e){
        var attr = {price_list_id: e.target.value};
        update_formset_state(attr);
    }

    function update_formset_state(new_attr){
        props.actions_formset.update(props.form_index, new_attr);
    }

    const controlled = {
        quantity: get_and_set(props.data.quantity, update_quantity),
        selling_price: get_and_set(props.data.selling_price, update_selling_price),
        product_id: get_and_set(props.data.product_id, update_product),
        price_list_id: get_and_set(props.data.price_list_id, update_price_list)
    }

    function handle_click_remove(e){
        e.preventDefault();
        props.actions_formset.remove(props.form_index);
    }

    // Display
    return <JobItemsCreatorRowUI    num_forms = { props.num_forms }
                                    handle_click = { handle_click_remove }
                                    controlled = { controlled }
                                    job_id = {props.job_id}
                                    URL_GET_DATA = { props.URL_GET_DATA }
                                    URL_ITEMS = {props.URL_ITEMS}
                                    form_index = { props.form_index }
                                    />
}

function JobItemsCreatorRowUI(props){
    // Django formsets require a specific format for names/IDs, so prepare that here
    const prefix = 'form-' + props.form_index + '-';
    const FFN_JOB = getFormsetFieldNames(prefix, 'job');

    return [
        <div class="form-row panel">
            <JobItemsCreatorRowRemoveButton num_forms = { props.num_forms }
                                            handle_click = { props.handle_click } />
            <JobItemSharedFormFields    controlled = { props.controlled }
                                        description = ''
                                        job_id = { props.job_id }
                                        prefix = { prefix }
                                        URL_GET_DATA = { props.URL_GET_DATA }
                                        URL_ITEMS = {props.URL_ITEMS}
                                        />

            <input type="hidden" name={ FFN_JOB.name } value={props.job_id} id={ FFN_JOB.id } />
        </div>
    ]
}

function JobItemsCreatorRowRemoveButton(props){
    // Ideally we don't want users to remove the last form from the formset, so if this is the last
    // form, exclude the convenient "remove" button.
    if(props.num_forms === 1){
        return null;
    }
    return <button class="remove-item-btn delete-panel" onClick={ props.handle_click }><span>remove</span></button>
}



// || JobItem Editor
function JobItemEditor(props){
    const [quantity, setQuantity] = React.useState(props.data.quantity);
    const [sellingPrice, setSellingPrice] = React.useState(props.data.selling_price);
    const [productId, setProductId] = React.useState(props.data.product_id);
    const [priceListId, setPriceListId] = React.useState(props.data.price_list_id);

    const [backendError, setBackendError] = React.useState(null);
    const backend_error = get_backend_error_object(backendError, setBackendError);

    function update_quantity(e){
        setQuantity(e.target.value);
    }
    function update_selling_price(e){
        setSellingPrice(e.target.value);
    }
    function update_product(e){
        setProductId(e.target.value);
    }
    function update_price_list(e){
        setPriceListId(e.target.value);
    }

    const controlled = {
        quantity: get_and_set(quantity, update_quantity),
        selling_price: get_and_set(sellingPrice, update_selling_price),
        product_id: get_and_set(productId, update_product),
        price_list_id: get_and_set(priceListId, update_price_list)
    };

    function handle_submit(e){
        e.preventDefault();
        save_item();
    }

    function handle_delete(){
        delete_jobitem();
    }

    const save_item = () => {
        const url = `${props.URL_ITEMS}?id=${props.data.ji_id}`;
        var headers = getFetchHeaders('PUT', state_to_object_be());

        update_server(url, headers, resp_data => {
            if(status_is_good(resp_data, 204)){

                // Changes to product and/or price list have knock-on effects on other
                // fields (e.g. list price, names) so if one of those has changed, 
                // update the entire item from the backend.
                let state_fe_obj = state_to_object_fe();
                if('product_id' in state_fe_obj || 'price_list_id' in state_fe_obj){
                    update_item_from_be();
                }
                else {
                    props.update_item(props.data.ji_id, state_fe_obj);
                    props.editor.off();
                }  

            }
            else{
                backend_error.set(get_error_message(resp_data));
            }
        });
    };

    function update_item_from_be(){
        var url = `${props.URL_ITEMS}?ji_id=${props.data.ji_id}`;

        fetch(url)
        .then(response => get_json_with_status(response))
        .then(resp_data => {
            if(status_is_good(resp_data, 200)){
                props.update_item(props.data.ji_id, resp_data);
                props.editor.off();
            }
            else{
                backend_error.set(get_error_message(resp_data));
            }
        })
        .catch(error => console.log(error))
    }

    function state_to_object_be(){
        return {
            quantity: quantity,
            selling_price: sellingPrice,
            product: productId,
            price_list: priceListId
        }
    }

    function state_to_object_fe(){
        var result = {}
        if(quantity != props.data.quantity){
            result['quantity'] = quantity;
        }
        if(sellingPrice != props.data.selling_price){
            result['selling_price'] = sellingPrice;
        }
        if(productId != props.data.product_id){
            result['product_id'] = productId;
        }
        if(priceListId != props.data.price_list_id){
            result['price_list_id'] = priceListId;
        }
        return result;
    }

    function delete_jobitem(){
        var url = `${props.URL_ITEMS}?id=${props.data.ji_id}`;
        var headers = getFetchHeaders('DELETE', null);

        update_server(url, headers, resp_data => {
            if(status_is_good(resp_data, 204)){
                props.delete_item(props.data.ji_id);
                props.editor.off();
            }
            else {
                backend_error.set(get_error_message(resp_data));
            }
        });
    }

    return <JobItemEditorUI backend_error= { backend_error }
                            controlled = { controlled }
                            description = { props.data.description }
                            editor = { props.editor }
                            handle_submit = { handle_submit }
                            handle_delete = { handle_delete }
                            job_id = { props.job_id }
                            URL_GET_DATA = { props.URL_GET_DATA }
                            URL_ITEMS = {props.URL_ITEMS}
                            />
}

function JobItemEditorUI(props){
    return [
        <div id="container_edit_item" class="panel form-like">
            <CancelButton cancel = { props.editor.off } />
            <h5 class="panel-header">Edit Item</h5>
            <BackendErrorUI message = { props.backend_error.message }
                            turn_off_error = { props.backend_error.clear } />
            <JobItemSharedFormFields    controlled = { props.controlled }
                                        description = {props.description}
                                        job_id = {props.job_id}
                                        prefix = ''         
                                        URL_GET_DATA = { props.URL_GET_DATA }
                                        URL_ITEMS = {props.URL_ITEMS}
                                        />
            <EditorControls     delete = { props.handle_delete }
                                submit = { props.handle_submit }
                                want_delete = { true }
                                />
        </div>
    ]
}

// || Shared form fields
function JobItemSharedFormFields(props){
    const [description, setDescription] = React.useState(props.description);

    function handle_product_change(e){
        props.controlled.product_id.set(e);
        update_product_description(e.target.value);
    }

    function update_product_description(product_id){
        // Note: the server uses the Job ID to determine the correct language for the description
        var url = `${props.URL_GET_DATA}?type=product_description&product_id=${product_id}&job_id=${props.job_id}`;
        fetch(url)
        .then(response => response.json())
        .then(resp_data => {
            // This feature is only a "nice to have", so if there's an error then desired behaviour = don't display anything
            if('desc' in resp_data){
                setDescription(resp_data.desc)
            }
        })
        .catch(error => console.log(error))
    }

    return <JobItemSharedFormFieldsUI   controlled = { props.controlled }
                                        description = { description }
                                        handle_product_change = { handle_product_change }
                                        prefix = ''     
                                        URL_GET_DATA = { props.URL_GET_DATA }
                                        />
}

function JobItemSharedFormFieldsUI(props){
    const FFN_QUANTITY = getFormsetFieldNames(props.prefix, 'quantity');
    const FFN_PRODUCT = getFormsetFieldNames(props.prefix, 'product');
    const FFN_SELLING_PRICE = getFormsetFieldNames(props.prefix, 'selling_price');
    const FFN_PRICE_LIST = getFormsetFieldNames(props.prefix, 'price_list');

    return [
        <div>
            <label for={ FFN_QUANTITY.id }>Quantity</label>
            <input  type="number" name={ FFN_QUANTITY.name } id={ FFN_QUANTITY.id } value={ props.controlled.quantity.get }
                    onChange={ props.controlled.quantity.set }/>

            <label for={ FFN_PRODUCT.id }>Item</label>
            <SelectBackendOptions   api_url = { props.URL_GET_DATA }
                                    get_param = 'products'
                                    handle_change = { props.handle_product_change }
                                    is_required = { true }
                                    select_id = { FFN_PRODUCT.id }
                                    select_name = { FFN_PRODUCT.name }
                                    selected_opt_id = { props.controlled.product_id.get }
                                    />
            <JobItemAutoDescUI  description = { props.description } />

            <label for={ FFN_SELLING_PRICE.id }>Selling Price</label>
            <input  type="number" name={ FFN_SELLING_PRICE.name } step="0.01" id={ FFN_SELLING_PRICE.id } value={ props.controlled.selling_price.get } 
                    onChange={ props.controlled.selling_price.set }/>

            <label for={ FFN_PRICE_LIST.id }>Price List</label>
            <SelectBackendOptions   api_url = { props.URL_GET_DATA }
                                    get_param = 'price_lists'
                                    handle_change = { props.controlled.price_list_id.set }
                                    is_required = { true }
                                    select_id = { FFN_PRICE_LIST.id }
                                    select_name = { FFN_PRICE_LIST.name }
                                    selected_opt_id = { props.controlled.price_list_id.get }
                                    />
        </div>
    ]
}


function JobItemAutoDescUI(props){
    // The CSS for this has a coloured border on the left. If it has no text inside, it looks a bit odd, so remove when not in use.
    if(props.description === '' || props.description === null){
        return null;
    }
    return <span class='desc'>{ props.description }</span>
}

function getFormsetFieldNames(prefix, fieldName){
    return {
        name: prefix + fieldName,
        id: 'id_' + prefix + fieldName
    }
}