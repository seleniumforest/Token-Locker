import React, { useState } from 'react';
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';
import '../../shared/styles/Modal.scss'
import { useDispatch, useSelector } from 'react-redux';
import { selectToken } from '../reduxSlices/tokenSelectorSlice';
import { loadTokenByContractAddress } from '../helpers';

const SelectTokenModal = () => {
    const { tokenSelectorSlice, externalDataSlice } = useSelector(state => state);
    const dispatch = useDispatch();

    const [open, setOpen] = useState(false);
    const onOpenModal = () => setOpen(true);
    const onCloseModal = () => setOpen(false);

    const fullTokenList = [
        externalDataSlice.nativeCurrency,
        ...externalDataSlice.tokenList
    ];
    const [shownTokens, setShownTokens] = useState(fullTokenList);

    return (
        <>
            <button className="big-button" onClick={onOpenModal}>
                <span>{tokenSelectorSlice.selectedToken.ticker} ▼</span>
            </button>
            <Modal
                open={open}
                onClose={onCloseModal}
                center
                classNames={{
                    overlay: 'custom-overlay',
                    modal: 'custom-modal',
                }}>
                <div>
                    <div>
                        Select Token
                    </div>
                    <div className="find-token">
                        <input className="big-input find-token-input"
                            placeholder="Find token or paste contract"
                            onChange={async (event) => {
                                let userInput = event.target.value.toLowerCase();

                                //load token by address
                                if (userInput.toLowerCase().startsWith("juno1")) {
                                    let importedToken = await loadTokenByContractAddress(userInput);
                                    setShownTokens([importedToken]);
                                    return;
                                }

                                //show all tokens
                                if (!userInput){
                                    setShownTokens(fullTokenList);
                                    return; 
                                }
                                
                                //filter by user input
                                let filtered = fullTokenList.filter(token => {
                                    let ticker = token?.ticker?.toLowerCase();
                                    let name = token?.name?.toLowerCase();

                                    if (token.isNative)
                                        return ticker.startsWith(userInput);

                                    return ticker.startsWith(userInput) ||
                                        name.startsWith(userInput);
                                });

                                setShownTokens(filtered);
                            }}
                        />
                    </div>
                    <div className="tokenlist">
                        {shownTokens.map(token => {
                            return (<div key={token.isNative ? 
                                              token.ticker : 
                                              token.address || token.ticker} className="tokenlist-token">
                                <button className={"big-button"} onClick={async () => {
                                    dispatch(selectToken(token));
                                    onCloseModal();
                                }}>
                                    { token.isNative ? 
                                        token.ticker : 
                                        `${token.name} (${token.ticker})`}
                                </button>
                            </div>);
                        })}
                    </div>
                </div>
            </Modal>
        </>
    )
};

export default SelectTokenModal;