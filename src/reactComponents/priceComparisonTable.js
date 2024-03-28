// || Price Comparison Table
import { format_money, format_percentage } from "../util";

export function PriceComparisonTable(props){
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
    // id="po-discrepancy"
    return (
        <section className="priceComparison">
            <dl>
                <div className="priceComparison_step">
                    <dt>{props.first_title}</dt>
                    <dd>
                        <span className="currency">{props.currency}</span>
                        <span className="po-total-price-f number">{format_money(props.first_value)}</span>
                    </dd>
                </div>
                <div className="priceComparison_step">
                    <dt>{props.second_title}</dt>
                    <dd>
                        <span className="currency">{props.currency }</span>
                        <span className="selling-price number">{format_money(props.second_value)}</span>
                    </dd>
                </div>
                <div className="priceComparison_conclusion">
                    <dt>Difference</dt>
                    <dd>
                        <span className="currency">{props.currency}</span>
                        <span className="diff-val number">{format_money(props.difference)}</span>
                        <span className="diff-perc">{format_percentage(props.difference_as_perc)}</span>
                    </dd>
                </div>
            </dl>
        </section>
    )
}


{/* <table className="priceComparison">
<tbody className="priceComparison_body">
    <tr className="priceComparison_step">
        <th>{props.first_title}</th>
        <td className="currency">{props.currency}</td>
        <td className="po-total-price-f number">{format_money(props.first_value)}</td>
        <td></td>
    </tr>
    <tr className="priceComparison_step">
        <th>{props.second_title}</th>
        <td className="currency">{props.currency }</td>
        <td className="selling-price number">{format_money(props.second_value)}</td>
        <td></td>
    </tr>
    <tr className="conclusion">
        <th>Difference</th>
        <td className="currency">{props.currency}</td>
        <td className="diff-val number">{format_money(props.difference)}</td>
        <td><span className="diff-perc">{format_percentage(props.difference_as_perc)}</span></td>
    </tr>
</tbody>
</table> */}