/*
    Manages the item-related buttons and inputs on the document builder page.

    Contents:
        || Imports
        || CSS and exported CSS
        || Add Event Listeners to Django Template
        || Main functions called by event listeners
        || Helpers in alphabetical order
        || DOM Element Finders
*/

// || Imports
import { 
    unsavedDocumentChangesWarning 
} from "./document_builder_main";

import { 
    create_generic_ele_dismissable_error 
} from "./util";

// || CSS and exported CSS
const CSS_CLASS = {
    itemWrapper: 'docItemEditor',
    maxButton: 'docItemEditor_maxBtn',
    minButton: 'docItemEditor_minBtn',
    qtyInput: 'docItemEditor_qtyInput',
    
    itemWrapperExcluded: 'docItemEditor_itemBuilder-excluded',
    invalidMessage: 'documentPageItems_invalidIcon',
    invalidMinBtn: 'docItemEditor_minBtn-invalid',
    invalidMaxBtn: 'docItemEditor_maxBtn-invalid',
    itemDisplayText: 'docItemEditor_itemDisplayText',
    itemQtySpan: 'docItemEditor_itemDisplayQty',
    itemPartNo: 'docItemEditor_itemDisplayPartNo',
    itemPartNoExcluded: 'partNumber-excluded',
    inputsContainer: 'docItemEditor_itemInputsContainer',
    inputErrorTooltip: 'docItemEditor_qtyErrorTooltip',
}
export const CSS_DOCITEM_INPUT_WRAPPER = CSS_CLASS.itemWrapper;

// || Add Event Listeners to Django Template
document.addEventListener('DOMContentLoaded', () => {

    document.querySelectorAll(`.${CSS_CLASS.maxButton}`).forEach(maxBtn =>
        maxBtn.addEventListener('click', () => {
            setInputToMax(maxBtn)
        })
    );

    document.querySelectorAll(`.${CSS_CLASS.minButton}`).forEach(minBtn =>
        minBtn.addEventListener('click', () => {
            setInputToMin(minBtn);
        })
    );

    document.querySelectorAll(`.${CSS_CLASS.qtyInput}`).forEach(qtyInput => 
        qtyInput.addEventListener('input', () => {
            handleQtyInputChange(qtyInput);
        })
    );
})


// || Main functions called by event listeners
function setInputToMax(maxBtn){
    const wrapper = getItemWrapper(maxBtn);
    const qtyInput = getQtyInput(wrapper);
    qtyInput.value = qtyInput.max;

    handleQtyInputChange(qtyInput);
}


function setInputToMin(minBtn){
    const wrapper = getItemWrapper(minBtn);
    const qtyInput = getQtyInput(wrapper);
    qtyInput.value = qtyInput.min;

    handleQtyInputChange(qtyInput);
}


function handleQtyInputChange(qtyInput){
    unsavedDocumentChangesWarning().on();

    const valueMaxMinObj = getValueMaxAndMinIntegers(qtyInput);
    const wrapper = getItemWrapper(qtyInput);

    if(!qtyInput.checkValidity()){
        const invalidValue = qtyInput.value;
        displayWarningTooltip(wrapper, invalidValue);
        forceValidQtyValue(qtyInput, valueMaxMinObj);
    }
    
    const { maxBtn, minBtn } = getButtons(wrapper);
    updateButtonsDisabled(maxBtn, minBtn, valueMaxMinObj);
    updateItemDescriptionQty(wrapper, qtyInput.value);
    updateItemDescriptionFormatting(wrapper, valueMaxMinObj);
    updateWrapperCSS(wrapper, valueMaxMinObj);
    removeInvalidWarning(wrapper);
}


// || Helpers in alphabetical order
function displayWarningTooltip(wrapper, invalidInput){
    const controlsContainer = wrapper.querySelector(`.${CSS_CLASS.inputsContainer}`);
    const messageStr = calcErrorStr(wrapper, invalidInput);
    const warningEle = create_generic_ele_dismissable_error(messageStr);
    warningEle.classList.add(CSS_CLASS.inputErrorTooltip);
    controlsContainer.append(warningEle);

    function calcErrorStr(wrapper, invalidInput){
        const totalQty = parseInt(wrapper.dataset.totalqty);
        const availableQty = parseInt(wrapper.dataset.availableqty);
        const invalidQtyAsInt = parseInt(invalidInput);

        let message = `${invalidInput} is an invalid input`;
        if(invalidInput === ''){
            message = "Invalid input, setting to 0.";
        }
        if(invalidQtyAsInt > availableQty && invalidQtyAsInt <= totalQty){
            message += ` (${totalQty - availableQty}/${totalQty} are assigned to other documents)`;
        }
        else if(invalidQtyAsInt > totalQty){
            message += ` (there are only ${totalQty} in total on the job)`;
        }

        return message;
    }
}


function forceValidQtyValue(qtyInput, valueMaxMinObj){
    const { value: invalidValue, max, min } = valueMaxMinObj;
    
    let validValue = 0;
    if(!isNaN(invalidValue) && !isNaN(max) && !isNaN(min)){
        validValue = 
            invalidValue > max
                ? max
                : min;
    } else {
        if(qtyInput.value === ''){
            validValue = 0;
        }
    }

    qtyInput.value = validValue.toString();
}



function getValueMaxAndMinIntegers(qtyInput){
    const isEmpty = qtyInput.value === '';
    return {
        value: isEmpty ? 0 : parseInt(qtyInput.value),
        max: parseInt(qtyInput.max),
        min: parseInt(qtyInput.min),
    }
}


function removeInvalidButtonCSS(wrapper){
    const {maxBtn, minBtn} = getButtons(wrapper);
    maxBtn.classList.remove(CSS_CLASS.invalidMaxBtn);
    minBtn.classList.remove(CSS_CLASS.invalidMinBtn);
}


function removeInvalidMessage(wrapper){
    const invalidMessage = getInvalidMessageEle(wrapper);
    if(invalidMessage !== null){
        invalidMessage.remove();
    }
}


function removeInvalidWarning(wrapper){
    if(wrapper.dataset.isinvalid){
        removeInvalidButtonCSS(wrapper);
        removeInvalidMessage(wrapper);
        wrapper.setAttribute('data-isinvalid', false);
    }
}


function updateButtonsDisabled(maxBtn, minBtn, valueMaxMinObj){
    const { value, max, min } = valueMaxMinObj;
    updateOneButtonDisabled(maxBtn, value >= max);
    updateOneButtonDisabled(minBtn, value <= min);
    return;

    function updateOneButtonDisabled(btnEle, wantDisabled){
        if(wantDisabled && !btnEle.disabled){
            btnEle.disabled = true;
        }
        else if(!wantDisabled && btnEle.disabled){
            btnEle.disabled = false;
        }
    }
}


function updateConditionalCSS({ele, hasCSS, wantCSS, oneCSSClass}){
    if(hasCSS && !wantCSS){
        ele.classList.remove(oneCSSClass);
    }
    else if(!hasCSS && wantCSS){
        ele.classList.add(oneCSSClass);
    }
}


function updateItemDescriptionFormatting(wrapper, valueMaxMinObj){
    const { value } = valueMaxMinObj;
    const partNoEle = wrapper.querySelector(`.${CSS_CLASS.itemPartNo}`);
    const partNoEleSettings = {
        ele: partNoEle,
        hasCSS: partNoEle.classList.contains(CSS_CLASS.itemPartNoExcluded),
        wantCSS: value === 0,
        oneCSSClass: CSS_CLASS.itemPartNoExcluded,
    }
    updateConditionalCSS(partNoEleSettings);
}


function updateItemDescriptionQty(wrapper, newValue){
    const qtyDescEle = wrapper.querySelector(`.${CSS_CLASS.itemQtySpan}`);
    qtyDescEle.textContent = newValue;
}


function updateWrapperCSS(wrapper, valueMaxMinObj){
    // Update CSS for excluded modifier
    const { value } = valueMaxMinObj;
    const excludedProps = {
        ele: wrapper,
        hasCSS: wrapper.classList.contains(CSS_CLASS.itemWrapperExcluded),
        wantCSS: value === 0,
        oneCSSClass: CSS_CLASS.itemWrapperExcluded,
    }
    updateConditionalCSS(excludedProps);
}


// || DOM Element Finders
export function getQtyInput(wrapper){
    return wrapper.querySelector(`.${CSS_CLASS.qtyInput}`);
}

function getItemWrapper(anyChildEle){
    return anyChildEle.closest(`.${CSS_CLASS.itemWrapper}`);
}

function getButtons(wrapper){
    return {
        maxBtn: wrapper.querySelector(`.${CSS_CLASS.maxButton}`),
        minBtn: wrapper.querySelector(`.${CSS_CLASS.minButton}`),
    }
}

function getInvalidMessageEle(wrapper){
    // 1 or 0 instances are expected, so this must handle both
    const query = wrapper.querySelectorAll(`.${CSS_CLASS.invalidMessage}`);
    return query.length === 0
        ? null
        : query[0];
}