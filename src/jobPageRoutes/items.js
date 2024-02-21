/*
    Summary:
    Items section on the Job page

    Contents:
        || Main section
        || Existing Table
        || Helpers
            > CSS class for module status
            > Functions to get product-centric info
*/

import { useJobContext } from "../hooks/useJobContext";
import { JobSectionHeadingNarrowUI } from "../reactComponents/jobPageHeadings.js";
import { format_money } from "../util";

import { JobItemIdIcon, JobItemPriceListIconSpan } from "../reactComponents/idTags";
import { EmptySectionUI } from "../reactComponents/loadingAndEmptiness";

import { JobItemsCreator } from "../reactComponentsWithHooks/itemCreator";
import { JobItemsDetailsContainer, useJobItemDetails } from "../reactComponentsWithHooks/itemDetails";


// || Main section
export function JobItemsUI(){
    const { actions, currency, job, modalKit } = useJobContext();

    const ID_FOR_MODAL = 'create_items_form';
    return (
        <section className="jobItems jobNarrowSection">
            <JobSectionHeadingNarrowUI text = {"Items"} />
            <div className="jobItems_contentWrapper">
                <button 
                    id="open_item_form_btn" 
                    className="add-button" 
                    onClick={ () => modalKit.open(ID_FOR_MODAL) }
                    disabled={ modalKit.isOpen() }
                    >
                    Add Items
                </button>
            { modalKit.isOpenedBy(ID_FOR_MODAL) ?
                <JobItemsCreator    
                    actions_items = { actions.jobItems }
                    closeEditor = { modalKit.close }
                    job_id = { job.id }
                />
                : null
            }
            { job.itemsList === undefined || job.itemsList === null || job.itemsList.length === 0 
                ? <EmptySectionUI 
                    css={'jobPage_emptySection'} 
                    message={'No items have been entered'} 
                />
                : <JobItemsExisting   
                    actions_items = { actions.jobItems }
                    currency = { currency }
                    items_list = { job.itemsList }
                    job_id = { job.id }
                    modalKit = { modalKit }
                    URL_MODULE_MANAGEMENT = { job.URL_MODULE_MANAGEMENT }
                />
            }
            </div>
        </section>
    )
}


// || Existing
function JobItemsExisting({ actions_items, currency, items_list, job_id, modalKit, URL_MODULE_MANAGEMENT }){
    const detailsKit = useJobItemDetails(items_list);

    // item_list is a JobItem-centric list, with parent-JobItem-centric slot assignment data.
    // Some parts of the page require product-centric slot assignment data instead.
    const product_slot_assignments = slot_assignment_data_by_product(items_list);

    return  <JobItemsExistingUI  
                actions_items = { actions_items }
                currency = { currency }
                detailsKit = { detailsKit }
                items_list = { items_list }
                job_id = { job_id }
                modalKit = { modalKit }
                product_slot_assignments = { product_slot_assignments }
                URL_MODULE_MANAGEMENT = { URL_MODULE_MANAGEMENT } 
            />
}


function JobItemsExistingUI({ actions_items, currency, detailsKit, items_list, job_id, modalKit, product_slot_assignments, URL_MODULE_MANAGEMENT }){
    return (
        <div className="jobItems_existingAndDetailsContainer">
            <JobItemsExistingTable
                currency = { currency } 
                detailsKit = { detailsKit }
            >
            { items_list.map((data) =>
                <JobItemRow key = { data.ji_id.toString() }
                    data = { data }
                    detailsKit = { detailsKit }
                />
            )}
            </JobItemsExistingTable>                      
            <JobItemsDetailsContainer   
                actions_items = { actions_items }
                currency = { currency }
                detailsKit = { detailsKit }
                job_id = { job_id }
                modalKit = { modalKit }
                product_slot_assignments = { product_slot_assignments }
                URL_MODULE_MANAGEMENT = { URL_MODULE_MANAGEMENT }
            />
        </div>
    )
}

// Existing: Table
function JobItemsExistingTable({ currency, detailsKit, children }){
    const css_class = detailsKit.activeItem === null ? 'banded' : 'details-visible';
    return (
        <table id="jobitems_table" className={ `jobItems_existing ${css_class}` }>
            <thead>
                <tr>
                    <th>id</th>
                    <th>qty</th>
                    <th>part #</th>
                    <th>name</th>
                    <th>modular</th>
                    <th>sold @ { currency }</th>
                    <th>price list</th>
                </tr>
            </thead>
            <tbody>
                { children }
            </tbody>
        </table>
    )
}


function JobItemRow({ data, detailsKit }){
    function toggle_details(){
        if(detailsKit.activeItem === data.ji_id){
            detailsKit.updateActive(null);
            document.activeElement.blur();
        }
        else {
            detailsKit.updateActive(data.ji_id);
        }
    }

    return <JobItemRowUI    
                data = { data }
                detailsKit = { detailsKit }
                toggle_details = { toggle_details }
            />
}


function JobItemRowUI({ data, detailsKit, toggle_details }){
    const statusKey = detailsKit.getStatusKey(data);
    const keys = detailsKit.statusKeys;

    const dark_icon_css = statusKey === keys.active ? 'dark' : null;
    const tr_css = statusKey === keys.active ?
        'details-active'
        : statusKey === keys.slotFiller ?
            'details-slotFiller'
            : statusKey === keys.productMatch ?
                'details-sameProduct'
                : null;
    const CSS_HIGHLIGHTED_TD = 'content-highlight-wrapper';

    const no_modules_css = data.is_modular ? '' : ' not-modular';
    
    return (
        <tr className={tr_css}>
            <td className="ji_id">
                <div className={CSS_HIGHLIGHTED_TD}>
                    <JobItemIdIcon ji_id = { data.ji_id } />
                </div>
            </td>
            <td className="quantity">
                { data.quantity }
            </td>
            <td className="part_no">
                <div className={CSS_HIGHLIGHTED_TD}>
                    { data.part_number }
                </div>
            </td>
            <td className="product_name">
                { data.product_name }
            </td>
            <td className={"modular" + no_modules_css}>
                <JobItemRowModularContentsUI 
                    css={CSS_HIGHLIGHTED_TD} 
                    data = { data }
                />
            </td>
            <td className="selling_price">
                { format_money(parseFloat(data.selling_price)) }
            </td>
            <td className="price_list">
                <JobItemPriceListIconSpan price_list_name = { data.price_list_name }/>
            </td>
            <td className="more_info">
                <button 
                    className={`more-icon${dark_icon_css === null ? '' : ' ' + dark_icon_css}`} 
                    onClick={ toggle_details }
                    type="button"
                >
                    <span>more info</span>
                </button>
            </td>
        </tr>
    )
}


function JobItemRowModularContentsUI({ css, data }){
    const modularStatusCSS = !data.is_modular 
        ? null 
        : 'modules-' + getJobItemModularStatusCSS(data);

    const display_str = !data.is_modular 
        ? '-'
        : data.excess_modules 
            ? 'special'
            : data.is_complete 
                ? 'ok'
                : 'invalid';

    return  <div className={`${ css !== null && modularStatusCSS !== null
                                ? `${css} ${modularStatusCSS}`
                                : css !== null
                                    ? css
                                    : modularStatusCSS }`}>
                { display_str }
            </div>
}


// || Helpers
export function getJobItemModularStatusCSS(data){
    // Shared with the "existing" items table and item details
    return data.excess_modules
        ? 'excess'
        : data.is_complete
            ? 'ok'
            : 'incomplete';
}


// Product-based info re. slot assignments. Rearrange "by JobItem" slot assignment information to be "by Product" instead
function slot_assignment_data_by_product(item_list){

    // Begin with an object containing all unique products on the Job (key = product_id)
    const result = initialise_products_list(item_list);

    // Update the products to include module slot assignment information
    for(let pidx in item_list){
        const parent = item_list[pidx];
        if(parent.module_list != null && parent.module_list.length > 0){
            for(let midx in parent.module_list){

                // If the product can't be found, something went wrong
                const product_key = parent.module_list[midx].product_id.toString();
                if(!(product_key in result)){
                    break;
                }
                // Update the product's "num_assigned" and "assignments".
                else{
                    // Modules store quantities on a "per parent item" basis, so multiply by parent.quantity to get the total
                    const total_used = parent.module_list[midx].quantity * parent.quantity;
                    result[product_key].num_assigned += total_used;

                    // Setup an object with all the data needed to display this assignment, then add it
                    const assignment = {
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

    // Product-based slot assignments: create an object containing all unique products on the job with the product_id as the key
    function initialise_products_list(item_list){
        const result = {};

        for(var idx in item_list){
            const this_item = item_list[idx];
            const prod_id_as_str = this_item.product_id.toString();

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
}


