// Price Check section on the Job page

function JobPriceCheck(props){
    return [
        <section id="price_check_section" class="item">
            <h3>Prices</h3>
            <JobPriceCheckEmpty   is_empty = {props.items_data.length == 0}/>
            <PriceAcceptanceToggle  price_accepted = {props.price_accepted}/>
            <JobPriceCheckSummary       currency = {props.currency}
                                        total_selling = {props.total_selling}
                                        total_list = {props.total_list}/>
            <JobPriceCheckDetails     data = {props.items_data}/>
        </section>
    ]
}

function JobPriceCheckEmpty(props){
    if(!props.is_empty){
        return null;
    }
    return [
        <p>Activates upon entering items.</p>
    ]
}

function PriceAcceptanceToggle(props){
    var css_class = props.price_accepted ? 'on' : 'off';
    var display_text = props.price_accepted ? 'accepted' : 'NOT ACCEPTED';

    return [
        <div id="price_confirmation_status">
            <div class={'status-indicator ' + css_class}>
                <span class="status-name">selling price is</span>
                <button id="price_confirmation_button" data-current_status={props.price_accepted}>{display_text}</button>
            </div>
        </div>
    ]
}

function JobPriceCheckSummary(props){
    return [
        <div id="price_summary" class="subsection">
            <h4>Comparison to List Price</h4>
            <PriceComparisonTable   currency = {props.currency}
                                    difference = {props.total_selling - props.total_list}
                                    first_title = 'Line Items Sum'
                                    first_value = {props.total_selling}
                                    second_title = 'List Prices Sum'
                                    second_value = {props.total_list}
                                    />
        </div>
    ]
}

function JobPriceCheckDetails(props){

    return [
        <div class="subsection">
            <h4>Details</h4>
            <table id="price_check_table" class="responsive-table">
                <thead>
                    <tr class="upper-h-row">
                        <th colspan={3}></th>
                        <th colspan={4}>vs. Price List</th>
                        <th colspan={4}>vs. Resale</th>
                    </tr>
                    <tr class="lower-h-row">
                        <th>part #</th>
                        <th>qty</th>
                        <th>sold @</th>
                        <th>version</th>
                        <th>value</th>
                        <th colspan={2}>difference</th>
                        <th>perc</th>
                        <th>value</th>
                        <th colspan={2}>difference</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        props.data.map((item) => 
                            <JobPriceCheckDetailsRow  key={item.ji_id.toString()}
                                                        data={item}/>
                        )
                    }
                </tbody>
            </table>
        </div>
    ]
}

function JobPriceCheckDetailsRow(props){
    var difference_list = props.data.selling_price - props.data.list_price;

    var resale_price = ((resale_perc) => {
        var multiplier = 1 - (resale_perc / 100);
        return props.data.list_price * multiplier;
    })(props.data.resale_perc);
    
    var difference_resale = props.data.selling_price - resale_price;

    return[
        <tr id={'price_check_row_' + props.data.ji_id }>
            <td class="description"><span class="details-toggle">{props.data.part_number}</span><span class="details hide">{props.data.product_name}</span></td>
            <td class="qty">{props.data.quantity}</td>
            <td class="selling-price-container"><span class="selling-price">{props.data.selling_price.toFixed(2)}</span><button class="edit-btn edit-icon" data-jiid={props.data.ji_id}><span>edit</span></button></td>
            <td class="version">{props.data.price_list.name}</td>
            <td class="list-price">{props.data.list_price.toFixed(2)}</td>
            <td class="list-diff-val">{difference_list.toFixed(2)}</td>
            <td class="list-diff-perc">{(difference_list / props.data.list_price * 100).toFixed(2)}%</td>
            <td class="resale-percentage">{props.data.resale_perc}%</td>
            <td class="resale-price">{resale_price.toFixed(2)}</td>
            <td class="resale-diff-val">{difference_resale.toFixed(2)}</td>
            <td class="resale-diff-perc">{(difference_resale / props.data.selling_price * 100).toFixed(2)}%</td>
        </tr>
    ]
}