/*
    Summary:
    Price check section on the Job page

    Contents:
        || Main section
        || Comparison table wrapper
        || Details table
*/

import { useState } from 'react';

import { JobSectionHeadingNarrowUI } from "../reactComponents/jobPageHeadings.js";
import { format_money, format_percentage } from "../util";

import { useEditor } from "../hooks/useEditor";

import { JobItemIdIcon, JobItemNameTagSpan, JobItemPriceListIconSpan } from "../reactComponents/idTags";
import { EmptySectionUI } from "../reactComponents/loadingAndEmptiness";
import { PriceComparisonTable } from "../reactComponents/priceComparisonTable";
import { WarningSubsection } from "../reactComponents/warningsInvalid";

import { ErrorWithClearUI } from '../reactComponentsWithHooks/errors';
import { PriceAcceptanceToggle } from "../reactComponentsWithHooks/priceAcceptanceToggle";
import { JobPriceCheckPriceEditorUI, usePriceCheckEditor } from '../reactComponentsWithHooks/priceCheckEditor';
import { useJobContext } from '../hooks/useJobContext';


// Main section
export function JobPriceCheck(){
    const { actions, calc, currency, job } = useJobContext();

    const total_items_list_price = job.itemsList.reduce((runningTotal, item) => { 
        return (parseFloat(item.list_price_each) * parseInt(item.quantity) ) + runningTotal 
    }, 0);

    return <JobPriceCheckUI 
                itemsActions = { actions.jobItems }
                currency = { currency }
                has_invalid_currency_po = { calc.has_invalid_currency_po } 
                items_list = { job.itemsList }
                job_id = { job.id }
                priceAccepted = { job.priceAccepted }
                priceAcceptedActions = { actions.priceAccepted }
                total_selling = { calc.total_items_value }
                total_list = { total_items_list_price }
            />
}

function JobPriceCheckUI({ itemsActions, currency, has_invalid_currency_po, items_list, priceAccepted, priceAcceptedActions, total_selling, total_list }){
    return (
        <section id="price_check_section" className="jobPriceCheck jobNarrowSection">
            <JobSectionHeadingNarrowUI text={"Prices"} />
            { items_list.length == 0
                ? 
                <EmptySectionUI  
                    message={"Activates upon entering items"} 
                    css={'jobPage_emptySection jobNarrowSection_content'} 
                />
                : 
                <>
                <PriceAcceptanceToggle  
                    priceAccepted = { priceAccepted }
                    priceAcceptedActions = { priceAcceptedActions }
                />
                <WarningSubsection      
                    message = { `The figures below assume all item selling prices are in the job currency, ${ currency }. If a selling price is actually in a different currency, the numbers will be inaccurate.` }
                    show_warning = { has_invalid_currency_po } 
                    title = "Caution: PO Currency Mismatch"
                />
                <JobPriceCheckSummaryUI     
                    currency = { currency }
                    total_selling = { total_selling }
                    total_list = { total_list }
                />
                <JobPriceCheckDetails       
                    itemsActions = { itemsActions }
                    currency = { currency }
                    items_list = { items_list }
                />
                </>
            }
        </section>
    )
}


// || Comparison table wrapper
function JobPriceCheckSummaryUI({ currency, total_list, total_selling }){
    return (
        <div className="subsection jobPriceCheckComparison jobNarrowSection_content">
            <h4>Comparison to List Price</h4>
            <PriceComparisonTable   
                currency = { currency }
                difference = { total_selling - total_list }
                first_title = 'Line Items Sum'
                first_value = { total_selling }
                second_title = 'List Prices Sum'
                second_value = { total_list }
            />
        </div>
    )
}


// || Details table
function JobPriceCheckDetails({ itemsActions, currency, items_list }){
    // In this section users can edit prices directly from the table. 
    // Only one price at a time though, so setup a shared editor here.
    const editor = useEditor();

    return (
        <div className="subsection jobPriceCheckDetails jobNarrowSection_content">
            <h4>Details</h4>
            <div className="subsection_contentWrapper jobPriceCheckDetails_contentWrapper">
                <table id="price_check_table" className="banded">
                    <JobPriceCheckDetailsTableHeadUI    
                        currency = { currency } 
                    />
                    <JobPriceCheckDetailsTableBodyUI  
                        currency = { currency }  
                        itemsActions = { itemsActions }
                        editor = { editor }
                        items_list = { items_list }
                    />
                </table>
            </div>
        </div>
    )
}

function JobPriceCheckDetailsTableHeadUI({ currency }){
    return (
        <thead>
            <tr className="upper-h-row">
                <th colSpan={4}></th>
                <th colSpan={4}>vs. Price List ({ currency })</th>
                <th colSpan={4}>vs. Resale ({ currency })</th>
            </tr>
            <tr className="lower-h-row">
                <th>id</th>
                <th>part #</th>
                <th>qty</th>
                <th>sold @</th>
                <th>version</th>
                <th>expected</th>
                <th colSpan={2}>difference</th>
                <th>discount</th>
                <th>expected</th>
                <th colSpan={2}>difference</th>
            </tr>
        </thead>
    )
}

function JobPriceCheckDetailsTableBodyUI({ currency, editor, itemsActions, items_list }){
    return (
        <tbody>
            { items_list.map((item) => 
                <JobPriceCheckDetailsTableRow key = { item.ji_id.toString() }
                    currency = { currency }
                    data = { item }
                    editor = { editor }    
                    itemsActions = { itemsActions }
                />
            )}
        </tbody>
    )
}


function JobPriceCheckDetailsTableRow({ currency, data, editor, itemsActions }){
    // Work out the numbers for this row and package them up nicely
    const price_calc = () => {
        const selling_price = parseFloat(data.selling_price);

        const list_price = parseFloat(data.list_price_each) * parseInt(data.quantity);
        const difference_list = selling_price - list_price;
    
        const resale_price = (resale_perc => {
            const multiplier = 1 - (parseFloat(resale_perc) / 100);
            return list_price * multiplier;
        })(data.resale_perc);
        
        const difference_resale = selling_price - resale_price;

        return {
            selling_price,
            list_price,
            difference_list,
            resale_price,
            difference_resale
        }
    }

    return <JobPriceCheckDetailsRowUI   
                calc = { price_calc() }
                currency = { currency }
                data = { data }
                editor = { editor }
                itemsActions={ itemsActions }
            />
}

// One row in the price check table
function JobPriceCheckDetailsRowUI({ calc, currency, data, editor, itemsActions }){
    return (
        <tr id={'price_check_row_' + data.ji_id }>
            <td className="ji_id">
                <JobItemIdIcon 
                    ji_id = { data.ji_id }
                />
            </td>
            <JobPriceCheckDetailsDescription
                data = { data } 
            />
            <td className="qty">
                { data.quantity }
            </td>
            <JobPriceCheckDetailsSellingPrice   
                calc = { calc }
                currency = { currency }
                data = { data }
                editor = { editor }
                itemsActions = { itemsActions }
            />
            <td className="version">
                <JobItemPriceListIconSpan 
                    price_list_name = { data.price_list_name } 
                />
            </td>
            <td className="list-price">{ format_money(calc.list_price) }</td>
            <td className="list-diff-val">{ format_money(calc.difference_list) }</td>
            <td className="list-diff-perc">
                { format_percentage(calc.difference_list / calc.list_price * 100, 2) }
            </td>
            <td className="resale-percentage">
                <JobItemNameTagSpan   
                    name = { format_percentage(parseFloat(data.resale_perc)) } 
                />
            </td>
            <td className="resale-price">{ format_money(calc.resale_price) }</td>
            <td className="resale-diff-val">{ format_money(calc.difference_resale) }</td>
            <td className="resale-diff-perc">
                { format_percentage(calc.difference_resale / calc.list_price * 100, 2) }
            </td>
        </tr>
    )
}

// Description <td>, with the toggle-able name
function JobPriceCheckDetailsDescription({ data }){

    // Allow users to click on the part number to show/hide the name of the product
    const [showName, setShowName] = useState(false);
    function toggle_name(){
        var want_name = !showName;
        setShowName(want_name);
    }

   return (
        <td className="description">
            <span 
                className="details-toggle partNumber" 
                onClick={ toggle_name }
            >
                { data.part_number }
            </span>
            { showName ?
                <span className="details">
                    { data.product_name }
                </span>
                : null
            }
        </td>
   )
}


// Selling price <td>, with the price editor
function JobPriceCheckDetailsSellingPrice({ calc, currency, data, editor, itemsActions }){
    const {
        backend_error,
        handle_list_click,
        handle_resale_click,
        customPrice,
        handle_change,
        handle_submit
    } = usePriceCheckEditor(calc, editor.close, itemsActions, data.ji_id);

    const ID_FOR_EDITOR = `job_pricecheck_editor_${data.ji_id}`;
    return (
        <td className="selling-price-container">
            { backend_error.message ?
                <ErrorWithClearUI 
                    message = { backend_error.message }
                    clear = { backend_error.clear } 
                />
                : null
            }
            <span className="selling-price">
                { format_money(calc.selling_price) }
            </span>
            <JobPriceCheckEditButtonUI
                priceEditorOn = { () => editor.open(ID_FOR_EDITOR) }
                priceEditorIsUnavailable = { editor.isOpen() }
            />
            { editor.isOpenedBy(ID_FOR_EDITOR) ?
                <JobPriceCheckPriceEditorUI  
                    calc = { calc }
                    cancel = { editor.close }
                    controlledPrice = { customPrice }
                    currency = { currency }
                    data = { data }
                    handle_change = { handle_change }
                    handle_list_click = { handle_list_click }
                    handle_resale_click = { handle_resale_click }
                    handle_submit = { handle_submit }
                />
                : null
            }
        </td>
    )
}


function JobPriceCheckEditButtonUI({ priceEditorOn, priceEditorIsUnavailable }){
    return  <button 
                className="edit-btn edit-icon" 
                onClick={ priceEditorOn }
                disabled={ priceEditorIsUnavailable }
                >
                <span>edit</span>
            </button>
}