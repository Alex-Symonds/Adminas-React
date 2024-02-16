// || Price Comparison Table
function PriceComparisonTable(props){
    let difference_as_perc = 0;
    if(props.second_value !== 0){
        difference_as_perc = props.difference / props.second_value * 100;
    }
    
    return  <PriceComparisonTableUI  
                currency = { props.currency }
                difference = { props.difference }
                difference_as_perc = { difference_as_perc }
                first_title = { props.first_title }
                first_value = { props.first_value }
                second_title = { props.second_title }
                second_value = { props.second_value }
            />
}

function PriceComparisonTableUI(props){
    return [
        <table id="po-discrepancy" class="price-comparison">
            <tr>
                <th>{props.first_title}</th>
                <td>{props.currency}</td>
                <td class="po-total-price-f number">{format_money(props.first_value)}</td>
                <td></td>
            </tr>
            <tr>
                <th>{props.second_title}</th>
                <td>{props.currency }</td>
                <td class="selling-price number">{format_money(props.second_value)}</td>
                <td></td>
            </tr>
            <tr class="conclusion">
                <th>Difference</th>
                <td>{props.currency}</td>
                <td class="diff-val number">{format_money(props.difference)}</td>
                <td><span class="diff-perc">{format_percentage(props.difference_as_perc)}</span></td>
            </tr>
        </table>
    ]
}

function QuantityNameLi(props){
    return [
        <li>{ props.quantity } x {props.name}</li>
    ]
}
