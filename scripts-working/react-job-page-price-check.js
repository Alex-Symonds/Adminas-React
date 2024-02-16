/*
    Summary:
    Price check section on the Job page

    Contents:
        || Main section
        || Comparison table wrapper
        || Details table
*/

// Main section
function JobPriceCheck({ currency, has_invalid_currency_po, itemsActions, items_list, job_id, priceAccepted, priceAcceptedActions, total_selling }){
    const total_items_list_price = items_list.reduce((runningTotal, item) => { 
        return (parseFloat(item.list_price_each) * parseInt(item.quantity) ) + runningTotal 
    }, 0);

    return <JobPriceCheckUI 
                itemsActions = { itemsActions }
                currency = { currency }
                has_invalid_currency_po = { has_invalid_currency_po } 
                items_list = { items_list }
                job_id = { job_id }
                priceAccepted = { priceAccepted }
                priceAcceptedActions = { priceAcceptedActions }
                total_selling = { total_selling }
                total_list = { total_items_list_price }
            />
}

function JobPriceCheckUI({ itemsActions, currency, has_invalid_currency_po, items_list, priceAccepted, priceAcceptedActions, total_selling, total_list }){
    return [
        <section id="price_check_section" class="jobPriceCheck jobNarrowSection">
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
    ]
}


// || Comparison table wrapper
function JobPriceCheckSummaryUI({ currency, total_list, total_selling }){
    return [
        <div class="subsection jobPriceCheckComparison jobNarrowSection_content">
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
    ]
}


// || Details table
function JobPriceCheckDetails({ itemsActions, currency, items_list }){
    // In this section users can edit prices directly from the table. 
    // Only one price at a time though, so setup a shared editor here.
    const editor = useEditor();

    return [
        <div class="subsection jobPriceCheckDetails jobNarrowSection_content">
            <h4>Details</h4>
            <div class="subsection_contentWrapper">
                <table id="price_check_table" class="banded">
                    <JobPriceCheckDetailsTableHeadUI    
                        currency = { currency } 
                    />
                    <JobPriceCheckDetailsTableBodyUI    
                        itemsActions = { itemsActions }
                        editor = { editor }
                        items_list = { items_list }
                    />
                </table>
            </div>
        </div>
    ]
}

function JobPriceCheckDetailsTableHeadUI({ currency }){
    return [
        <thead>
            <tr class="upper-h-row">
                <th colspan={4}></th>
                <th colspan={4}>vs. Price List ({ currency })</th>
                <th colspan={4}>vs. Resale ({ currency })</th>
            </tr>
            <tr class="lower-h-row">
                <th>id</th>
                <th>part #</th>
                <th>qty</th>
                <th>sold @</th>
                <th>version</th>
                <th>expected</th>
                <th colspan={2}>difference</th>
                <th>discount</th>
                <th>expected</th>
                <th colspan={2}>difference</th>
            </tr>
        </thead>
    ]
}

function JobPriceCheckDetailsTableBodyUI({ itemsActions, editor, items_list }){
    return [
        <tbody>
            { items_list.map((item) => 
                <JobPriceCheckDetailsTableRow key = { item.ji_id.toString() }
                    data = { item }
                    editor = { editor }    
                    itemsActions = { itemsActions }
                />
            )}
        </tbody>
    ]
}


function JobPriceCheckDetailsTableRow({ data, editor, itemsActions }){
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
                data = { data }
                editor = { editor }
                itemsActions={ itemsActions }
            />
}

// One row in the price check table
function JobPriceCheckDetailsRowUI({ calc, data, editor, itemsActions }){
    return[
        <tr id={'price_check_row_' + data.ji_id }>
            <td class="ji_id">
                <JobItemIdIcon 
                    ji_id = { data.ji_id }
                />
            </td>
            <JobPriceCheckDetailsDescription
                data = { data } 
            />
            <td class="qty">
                { data.quantity }
            </td>
            <JobPriceCheckDetailsSellingPrice   
                calc = { calc }
                data = { data }
                editor = { editor }
                itemsActions = { itemsActions }
            />
            <td class="version">
                <JobItemPriceListIconSpan 
                    price_list_name = { data.price_list_name } 
                />
            </td>
            <td class="list-price">{ format_money(calc.list_price) }</td>
            <td class="list-diff-val">{ format_money(calc.difference_list) }</td>
            <td class="list-diff-perc">
                { format_percentage(calc.difference_list / calc.list_price * 100, 2) }
            </td>
            <td class="resale-percentage">
                <JobItemNameTagSpan   
                    name = { format_percentage(parseFloat(data.resale_perc)) } 
                />
            </td>
            <td class="resale-price">{ format_money(calc.resale_price) }</td>
            <td class="resale-diff-val">{ format_money(calc.difference_resale) }</td>
            <td class="resale-diff-perc">
                { format_percentage(calc.difference_resale / calc.resale_price * 100, 2) }
            </td>
        </tr>
    ]
}

// Description <td>, with the toggle-able name
function JobPriceCheckDetailsDescription({ data }){

    // Allow users to click on the part number to show/hide the name of the product
    const [showName, setShowName] = React.useState(false);
    function toggle_name(){
        var want_name = !showName;
        setShowName(want_name);
    }

   return [
        <td class="description">
            <span 
                class="details-toggle" 
                onClick={ toggle_name }
            >
                { data.part_number }
            </span>
            { showName ?
                <span class="details">
                    { data.product_name }
                </span>
                : null
            }
        </td>
   ] 
}


// Selling price <td>, with the price editor
function JobPriceCheckDetailsSellingPrice({ calc, data, editor, itemsActions }){
    const {
        backend_error,
        handle_list_click,
        handle_resale_click,
        customPrice,
        handle_change,
        handle_submit
    } = usePriceCheckEditor(calc, editor.close, itemsActions, data.ji_id);

    const ID_FOR_EDITOR = `job_pricecheck_editor_${data.ji_id}`;
    return [
        <td class="selling-price-container">
            { backend_error.message ?
                <ErrorWithClearUI 
                    message = { backend_error.message }
                    clear = { backend_error.clear } 
                />
                : null
            }
            <span class="selling-price">
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
                    customPrice = { customPrice }
                    data = { data }
                    handle_change = { handle_change }
                    handle_list_click = { handle_list_click }
                    handle_resale_click = { handle_resale_click }
                    handle_submit = { handle_submit }
                />
                : null
            }
        </td>
    ]
}


function JobPriceCheckEditButtonUI({ priceEditorOn, priceEditorIsUnavailable }){
    return  <button 
                class="edit-btn edit-icon" 
                onClick={ priceEditorOn }
                disabled={ priceEditorIsUnavailable }
                >
                <span>edit</span>
            </button>
}