/*
    Price check editor
    Displays as a tooltip/popout thing

    || Hook
    || Components
*/

import { useState } from 'react';

import { capitaliseFirstLetter, format_money } from '../util';

import { useAsyncWithError } from '../hooks/useAsyncWithError';

import { CancelButton, SubmitButton } from '../reactComponents/buttons';

// || Hook
export function usePriceCheckEditor(calc, closeFn, itemsActions, ji_id){
    const [inputPrice, setInputPrice] = useState('');

    function handle_change(e){
        console.log("Changed detected. Setting price to ", e.target.value);
        setInputPrice(e.target.value);
    }

    function handle_submit(e){
        e.preventDefault();
        update_price(inputPrice);
    }
    function handle_list_click(){
        console.log("list clicked", calc.list_price.toString());
        setInputPrice(calc.list_price.toString());
    }
    function handle_resale_click(){
        console.log("resale clicked", calc.resale_price.toString());
        setInputPrice(calc.resale_price.toString());
    }

    const asyncHelper = useAsyncWithError(closeFn);
    function update_price(new_price){
        const new_attributes = {
            selling_price: new_price
        }
        asyncHelper.handleAsync(() => itemsActions.update(ji_id, new_attributes, new_attributes));
    }

    return {
        backend_error: asyncHelper.asyncError,
        customPrice: inputPrice,
        handle_change,
        handle_list_click,
        handle_resale_click,
        handle_submit
    }
}




// || Components
export function JobPriceCheckPriceEditorUI({ calc, cancel, controlledPrice, currency, data, handle_change, handle_list_click, handle_resale_click, handle_submit }){
    console.log("JobPriceCheckPriceEditorUI data", data);
    return (
        <div className="priceCheckEditor panel popout">
            <CancelButton cancel = { cancel }/>

            <h5 className="panel-header">
                Edit Price
            </h5>

            <details className={"priceCheckEditor_descriptionContainer"}>
                <summary className="priceCheckEditor_descriptionSummary">
                    <div className="summaryContentNextToArrow priceCheckEditor_nextToDetailsArrow">
                        <p className={"priceCheckEditor_description"}>
                            <span className={"priceCheckEditor_descQty"}>{data.quantity}</span><span className={"priceCheckEditor_partNumber partNumber"}>{data.part_number }</span>{data.product_name }
                        </p>
                    </div>
                </summary>
                <dl className={"priceCheckEditor_pricesContainer"}>
                    <span className={"priceCheckEditor_currencyForPrices"}>
                        { currency }
                    </span>
                    <PresetPriceInfoUI
                        price={ data.selling_price }
                        title={"Current"}
                    />
                    <PresetPriceInfoUI
                        price={ calc.list_price }
                        title={"List"}
                    />
                    <PresetPriceInfoUI
                        price={ calc.resale_price }
                        title={"Resale"}
                    />
                </dl>
            </details>

            <PriceEditorFormUI 
                controlledPrice = { controlledPrice }
                handle_change = { handle_change }
                handle_list_click = { handle_list_click }
                handle_resale_click = { handle_resale_click }
                handle_submit = { handle_submit }
            />

        </div>

    )
}


function PresetPriceInfoUI({price, title}){
    return (
        <div className={"priceCheckEditor_onePriceData"}>
            <dt className={"priceCheckEditor_priceTitle"}>{ title }</dt>
            <dd className={"priceCheckEditor_priceValue"}>{ format_money(parseFloat(price)) }</dd>
        </div>
    )
}


function PriceEditorFormUI({ controlledPrice, handle_change, handle_list_click, handle_resale_click, handle_submit }){
    return (
        <form className="priceCheckEditor_form" method="post" onkeydown="return event.key != 'Enter';">

            <div class={"priceCheckEditor_formContentsInputsWrapper"}>
                <div className={"priceCheckEditor_manualInputWrapper"} >
                    <label 
                        className={"priceCheckEditor_label"} 
                        htmlFor={"id_new_price"} 
                    >
                        Enter new price
                    </label>

                    <input 
                        className={"priceCheckEditor_input"} 
                        id={"id_new_price"} 
                        type="number" 
                        step={0.01} 
                        name='new_price' 
                        value={ controlledPrice } 
                        onChange={ handle_change } 
                    />
                </div>

                <PricePresets 
                    handle_list_click = { handle_list_click }
                    handle_resale_click = { handle_resale_click }
                />
            </div>

            <SubmitButton 
                submit={ handle_submit } 
                cssClasses={"priceCheckEditor_submit formControls_submit"} 
            />
        </form>
    )
}


function PricePresets({ handle_list_click, handle_resale_click }){
    return(
        <div className="priceCheckEditor_presetButtonsContainer">
            <PresetPriceButtonUI    
                handle_click = { handle_list_click }
                price_type = 'list'
            />
            <PresetPriceButtonUI    
                handle_click = { handle_resale_click }
                price_type = 'resale'
            />
        </div>
    )
}


function PresetPriceButtonUI({ handle_click, price_type }){
    return  <button 
                className={`priceCheckEditor_preset${capitaliseFirstLetter(price_type)}Button`}
                onClick={ handle_click }
                type={"button"}
            >
                <span>set to { price_type }</span>
            </button>
}

