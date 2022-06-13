import React from 'react';
import { Modal } from 'react-responsive-modal';
import 'react-responsive-modal/styles.css';
import '../../shared/styles/Modal.scss'
import { useDispatch, useSelector } from 'react-redux';
import { selectToken } from '../reduxSlices/tokenSelectorSlice';
import { useModal } from '../hooks/useModal';
import { useTokenFilter } from '../hooks/useTokenFilter';

const SelectTokenModal = () => {
    const { tokenSelectorSlice } = useSelector(state => state);
    const { filter, shownTokens } = useTokenFilter();
    const { open, onOpenModal, onCloseModal } = useModal();
    const dispatch = useDispatch();
    
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
                            onChange={filter}
                        />
                    </div>
                    <div className="tokenlist">
                        {shownTokens.map(token => {
                            return (<div key={token.address || token.ticker} className="tokenlist-token">
                                <button className={"big-button"} onClick={async () => {
                                    dispatch(selectToken(token));
                                    onCloseModal();
                                }}>
                                    {`${token.name} (${token.ticker})`}
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