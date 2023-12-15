function BigErrorMessage({errorStr, close}){
    return  <Modal close={close}>
                <section className={"bigErrorMessage"}>
                    <h2 className={"bigErrorMessage_heading"}>
                        Error
                    </h2>
                    <p className={"bigErrorMessage_genericText"}>
                        The following error has occurred:
                    </p>
                    <p className={"bigErrorMessage_specificError"}>
                        { errorStr }
                    </p>
                    <p className={"bigErrorMessage_genericText"}>
                        If the error did not contain any specific instructions to resolve the issue, try refreshing the page.
                    </p>

                </section>
            </Modal>
}