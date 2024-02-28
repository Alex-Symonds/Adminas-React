/*
    Add event listeners to the product buttons on the records page, which activate
    a modal displaying a list of products. 
        > Modal DOM elements are already on the page, added via the Django template
        > All the button needs to do is "turn them on"
*/
import {
    findModalWrapperFromParent,
    open_modal,
    findAllModalCloseButtons,
    setupModalCloseButton,
} from './modal.js';


document.addEventListener('DOMContentLoaded', () => {
    setupRecordsProductsModal()
});


function setupRecordsProductsModal(){
    setupRecordsProductsOpeners();
    findAllModalCloseButtons().forEach(btn => {
        setupModalCloseButton(btn);
    });
}

function setupRecordsProductsOpeners(){
    const CSS_MODAL_OPENER = 'recordsTable_productsButton';
    const modalOpeners = document.querySelectorAll(`.${CSS_MODAL_OPENER}`);
    if(modalOpeners !== null){
        modalOpeners.forEach(btn => {
            btn.addEventListener('click', () => {
                const wrapper = findModalWrapperFromParent(btn.parentNode);
                open_modal(wrapper);
            });
        })
    }
}  

