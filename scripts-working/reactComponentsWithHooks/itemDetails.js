/*
    Job Items Details Section
    || Hook
        > Also used by JobItems existing table to handle the formatting
          of selected and related table rows
    || Container
    || JobItem: one individual JobItem 
    || Slot Filler
*/

// || Hook
function useJobItemDetails(items_list){
    const [activeItem, setActiveItem] = React.useState(null);

    // Adjust which JobItem is displayed in the panel
    function updateActive(ji_id){
        if(items_list.some(element => element.ji_id === ji_id)){
            setActiveItem(ji_id);
            return;
        }
        setActiveItem(null);
    }

    // Retrieve data about the chosen JobItem
    function getActiveData(){
        if(activeItem === null || items_list === undefined || items_list === null || items_list.length === 0){
            return null;
        }
    
        const parent_index = items_list.findIndex(ele => ele['ji_id'] === parseInt(activeItem));
        if(parent_index === -1){
            return null;
        }
    
        return items_list[parent_index];
    }

    // Check the relationship between another JobItem and the chosen JobItem
    const statusKeys = {
        active: "active",
        slotFiller: "slotFiller",
        productMatch: "productMatch"
    }
    function getStatusKey(itemData){
        const activeData = getActiveData();

        if(activeData === null){
            return null;
        }
    
        if(activeData.ji_id === itemData.ji_id){
            return statusKeys.active;
        }
    
        if(activeData.product_id === itemData.product_id){
            return statusKeys.productMatch;
        }
    
        const index = activeData.module_list.findIndex(ele => ele.product_id === itemData.product_id);
        return index === -1
            ? null
            : statusKeys.slotFiller;
    }

    return {
        activeItem,
        updateActive,
        getActiveData,
        statusKeys,
        getStatusKey
    }
}


// || Container
function JobItemsDetailsContainer({ actions_items, currency, detailsKit, job_id, modalKit, product_slot_assignments, URL_MODULE_MANAGEMENT }){
    const detailsActiveData = detailsKit.getActiveData();

    return [
        <ExpandableWrapper 
            css = {`jobItems_detailsWrapper jobItems_detailsWrapper-${detailsActiveData === null ? "inactive" : "active"}` } 
        >
            <div class="jobItems_detailsHeaderStrip">
                <h4 className={"jobItems_detailsHeader"}>item details</h4>
                <CancelButton
                    cancel = { () => detailsKit.updateActive(null) } 
                    css = { "jobItems_closeDetailsButton" } 
                />
            </div>
            <div class={"jobItems_detailsContent"}>

            { detailsActiveData === null ?
                <p className={"jobItems_noSelectionMessage"}>Select an item to view details</p>
                :
                <>
                <JobItem    
                    actions_items = { actions_items }
                    currency = { currency }
                    data = { detailsActiveData }
                    job_id = { job_id }
                    modalKit = { modalKit }
                    product_slot_data = { product_slot_assignments[detailsActiveData.product_id.toString()] }
                    URL_MODULE_MANAGEMENT = { URL_MODULE_MANAGEMENT }
                />
            { detailsActiveData.module_list.map(mod =>
                <JobItemSlotFillerUI   key = { String(mod.product_id) }
                    currency = { currency }
                    data = { product_slot_assignments[mod.product_id.toString()] }
                />
            )}
                </>
            }
            </div>
        </ExpandableWrapper>
    ]
}


// || JobItem: one individual JobItem 
function JobItem({ actions_items, currency, data, job_id, modalKit, product_slot_data, URL_MODULE_MANAGEMENT }){
    
    const ID_FOR_MODAL = `jobItem_edit_${data.ji_id}`;
    return modalKit.isOpenedBy(ID_FOR_MODAL)
        ? <JobItemEditor  
            closeEditor = { modalKit.close } 
            data = { data }
            delete_item = { actions_items.remove }
            job_id = { job_id }
            update_item = { actions_items.update }
        />
        : <JobItemReaderUI 
            currency = { currency }
            data = { data }
            job_id = {job_id}
            openJobItemEditor = { () => modalKit.open(ID_FOR_MODAL) }
            product_slot_data = { product_slot_data }
            URL_MODULE_MANAGEMENT = { URL_MODULE_MANAGEMENT }
        />
}

function JobItemReaderUI({ currency, data, job_id, openJobItemEditor, product_slot_data, URL_MODULE_MANAGEMENT }){
    return [
        <div class="jobItems_detailsJobItem">
            <JobItemHeadingUI   
                description = { data.description }
                ji_id = { data.ji_id }
                part_number = { data.part_number }
                product_name = { data.product_name }
                quantity = { data.quantity }
            />
            <JobItemMoneyUI 
                currency = { currency }
                data = { data }
                openJobItemEditor = { openJobItemEditor }
            />
        { data.standard_accessories.length === undefined || data.standard_accessories.length === null || data.standard_accessories.length  === 0
            ? null
            : <JobItemAccessoriesUI data = { data } />
        }
        { data.is_modular ?
            <JobItemSpecificationUI 
                data = { data }
                job_id = { job_id }
                URL_MODULE_MANAGEMENT = { URL_MODULE_MANAGEMENT }
            />
            : null
        }
            <JobItemsWithMatchingProduct 
                currency = { currency }
                data = { product_slot_data }
                exclude_id = { data.ji_id }
                title = { 'Product also entered as' }
            />
        { product_slot_data.assignments.length === 0
            ? null
            : <JobItemAssignmentsUI   product_slot_data = { product_slot_data } />
        }
        </div>
    ]
}

// JobItemReader: subsection, shared with Products
function JobItemHeadingUI({ description, ji_id, part_number, product_name, quantity }){
    return [
        <div class="subsection">
            <h5 class="subsection_heading what">
            { quantity === 0 || quantity === null || quantity === undefined
                ? null
                : <JobItemHeadingQuantitySpan  quantity = { quantity } />
            }
                <span class="product">{ part_number }: { product_name }</span>
                <JobItemIdIcon  ji_id = { ji_id } />
                <div class="desc">{description}</div>
            </h5>
        </div>
    ]
}

function JobItemHeadingQuantitySpan({ quantity }){
    return <span class="quantity">{ quantity } x </span>
}

// JobItemReader: subsection
function JobItemMoneyUI({ currency, data, openJobItemEditor }){
    const selling_price = parseFloat(data.selling_price);
    return [
        <div class="money subsection">
            <span class="selling_price">
                { currency + nbsp() + format_money(selling_price) }
            </span>
            <JobItemPriceListIconSpan price_list_name = { data.price_list_name } />
            <button 
                class="ji-edit edit-icon" 
                onClick={ openJobItemEditor }
            >
                <span>edit</span>
            </button>
        </div>
    ]
}

// JobItemReader: subsection
function JobItemAccessoriesUI({ data }){
    const clarify_each_if_multiple = data.quantity > 1 ? ' (in total)' : '';
    return [
        <div class="std-accs-container subsection">
            <div class="std-accs">
                <p>Included accessories{clarify_each_if_multiple}</p>
                <ul>
                { data.standard_accessories.map((std_acc, index) =>
                    <QuantityNameLi key = {index}
                        name = {std_acc.product_name}
                        quantity = {std_acc.quantity} 
                    />
                )}
                </ul>
            </div>
        </div>
    ]
}

// JobItemReader: subsection
function JobItemSpecificationUI({ data, URL_MODULE_MANAGEMENT }){
    const warning_message = data.is_complete ? null : 'incomplete'.toUpperCase();
    const heading_display_str = `${data.excess_modules ? "Special " : ""}Specification${data.quantity > 1 ? ' (per' + nbsp() + 'item)' : ""}`;
    const css_module_status = getJobItemModularStatusCSS(data);

    return [
        <div class={'module-status-section subsection modules-' + css_module_status}>
            <div class="intro-line">
                <span class="display-text">
                    &raquo;&nbsp;{heading_display_str} 
                </span>
                { warning_message === null 
                    ? null
                    : <WarningMessageSpan message = { warning_message } />
                }
                <a  href={URL_MODULE_MANAGEMENT + '#modular_jobitem_' + data.ji_id} 
                    class="edit-icon"
                >
                    <span>edit</span>
                </a>
            </div>
            <ul class="details">
                {
                    data.module_list.map((mod) => 
                        <QuantityNameLi key = {mod.module_id.toString()}
                            name = {mod.name}
                            quantity = {mod.quantity} 
                        />
                    )
                }
            </ul>
        </div>
    ]
}


function WarningMessageSpan({ message }){
    return <span class="warning-msg">
                <span class="invalid-icon"></span>
                <span class="msg">{ message }</span>
            </span>
}


// JobItemReader: subsection, also used for Slot Fillers
function JobItemsWithMatchingProduct({ currency, data, exclude_id, title }){
    // JobItem sections will pass in their own ji_id as "props.exclude_id": this should be removed from the list
    // Product sections will not, so use the full list
    const filtered_members = exclude_id === null ? data.members : data.members.filter(item => item.ji_id !== exclude_id);

    // If there are no (remaining) members, skip this section
    return filtered_members.length === 0
        ? null
        : <JobItemsWithMatchingProductUI    
            currency = { currency }
            members = { filtered_members }  
            title = { title }
        />
}

function JobItemsWithMatchingProductUI({ currency, members, title }){
    return [
        <div class="subsection product">
            <div class="subsection_heading">
                { title }
            </div>
            <div class="ji-list">
                <table>
                { members.map(member =>
                    <JobItemWithMatchingProductRowUI key = { member.ji_id.toString() }
                        currency = { currency }
                        data = { member }
                    />
                )}
                </table>
            </div>
        </div>
    ]
}

function JobItemWithMatchingProductRowUI({ currency, data }){
    return [
        <tr>
            <td>
                <JobItemIdIcon ji_id = { data.ji_id } />
            </td>
            <td class="desc">
                { data.quantity } for { currency + nbsp() + format_money(parseFloat(data.selling_price) ) }
            </td>
            <td>
                <JobItemPriceListIconSpan price_list_name = { data.price_list_name } />
            </td>
        </tr>
    ]
}


// JobItemReader: subsection, also used for Slot Fillers
function JobItemAssignmentsUI({ product_slot_data }){
    return [
        <div class="module-status-section assignments subsection">
            <div class="intro-line">
                <span class="display-text">
                    &laquo; Assignment
                </span>
                <div class="usage-counters">
                <JobItemAssignmentsCounterUI
                    display_str='used'
                    num = {product_slot_data.num_assigned}
                    total = {product_slot_data.total_product_quantity} 
                />
                <JobItemAssignmentsCounterUI    
                    display_str='unused'
                    num = {product_slot_data.total_product_quantity - product_slot_data.num_assigned}
                    total = {product_slot_data.total_product_quantity} 
                />
                </div>
            </div>
            <ul>
            { product_slot_data.assignments.map((a, index) => 
                <JobItemAssignmentLiUI  key = {index}
                    data = {a}
                />
            )}
            </ul>
        </div>
    ]
}

// JobItemReader: JobItemAssignments helper. One of the little "x/y used" thingies
function JobItemAssignmentsCounterUI({ display_str, num, total }){
    return [
        <div class="assignment-icon">
            <span class="label">{display_str}</span>
            <span class="status">{num}{display_str === 'used' ? "/" + total : ""}</span>
        </div>
    ]
}

// JobItemReader: JobItemAssignments helper. Display one assignment as an <li>
function JobItemAssignmentLiUI({ data }){
    var each = data.parent_qty > 1 ? 'each ' : '';
    return [
        <li>
            { data.quantity } {each}to {data.parent_qty} x [{data.part_num}] {data.product_name}
            <JobItemIdIcon ji_id = { data.parent_id } />
        </li>
    ]
}


// || Slot Filler
function JobItemSlotFillerUI({ currency, data }){
    return [
        <div class="jobItems_detailsJobItem product">
            <JobItemHeadingUI   
                description = { data.description }
                ji_id = { null }
                part_number = { data.part_number }
                product_name = { data.product_name }
                quantity = { null }
            />
            <JobItemSlotFillerQuantityUI 
                quantity = { data.total_product_quantity }
            />
            <JobItemsWithMatchingProduct 
                currency = { currency }
                data = { data }
                exclude_id = { null }
                title = { 'Entered as' }
                />
            <JobItemAssignmentsUI 
                product_slot_data = { data } 
            />  
        </div> 
    ]
}

function JobItemSlotFillerQuantityUI({ quantity }){
    return [
        <div class="subsection">
            <span class="product-quantity">
                Total quantity: { quantity }
            </span>
        </div>
    ]
}


