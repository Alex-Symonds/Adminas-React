/*
    Price check editor
    Displays as a tooltip/popout thing

    || Hook
    || Components
*/

import { useState } from 'react';

import { format_money } from '../util';

import { useAsyncWithError } from '../hooks/useAsyncWithError';

import { CancelButton, SubmitButton } from '../reactComponents/buttons';

// || Hook
export function usePriceCheckEditor(calc, closeFn, itemsActions, ji_id){
    const [customPrice, setCustomPrice] = useState('');

    function handle_change(e){
        setCustomPrice(e.target.value);
    }

    function handle_submit(){
        update_price(customPrice);
    }
    function handle_list_click(){
        update_price(calc.list_price);
    }
    function handle_resale_click(){
        update_price(calc.resale_price);
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
        customPrice,
        handle_change,
        handle_list_click,
        handle_resale_click,
        handle_submit
    }
}


// || Components
export function JobPriceCheckPriceEditorUI({ calc, cancel, controlledPrice, data, handle_change, handle_list_click, handle_resale_click, handle_submit }){
    return (
        <div className="priceCheckEditor panel popout">
            <CancelButton cancel = { cancel }/>
            <h5 className="panel-header">
                Edit Price
            </h5>
            <p className={"priceCheckEditor_description"}>
                {data.quantity} x [{data.part_number }] {data.product_name }
            </p>
            <div className="priceCheckEditor_optionsContainer">
                <h6 className={"priceCheckEditor_optionsHeading"}>
                    Click new price
                </h6>
                <PresetPriceButtonUI    
                    handle_click = { handle_list_click }
                    price_preset = { calc.list_price }
                    price_type = 'list'
                />
                <PresetPriceButtonUI    
                    handle_click = { handle_resale_click }
                    price_preset = { calc.resale_price }
                    price_type = 'resale'
                />
            </div>
            <ManualPriceInput
                controlledPrice = { controlledPrice }
                handle_change = { handle_change }
                handle_submit = { handle_submit }
            />
        </div>
    )
}

function PresetPriceButtonUI({ handle_click, price_type, price_preset }){
    return  <button 
                className="priceCheckEditor_presetPriceButton buttonSecondary" 
                onClick={handle_click }
                type={"button"}
            >
                { price_type } ({ format_money(parseFloat(price_preset)) })
            </button>
}

function ManualPriceInput({ customPrice, handle_change, handle_submit }){
    return (
        <form className="priceCheckEditor_customPrice singleInputWithButton">
            <label 
                className={"singleInputWithButton_label"} 
                htmlFor={"id_new_price"} 
            >
                Or enter your own and submit
            </label>
            <input 
                className={"singleInputWithButton_input"} 
                id={"id_new_price"} 
                type="number" 
                step={0.01} 
                name='new_price' 
                value={ customPrice } 
                onChange={ handle_change } 
            />
            <SubmitButton 
                submit={ handle_submit } 
                cssClasses={"singleInputWithButton_submit formControls_submit"} 
            />
        </form>
    )
}