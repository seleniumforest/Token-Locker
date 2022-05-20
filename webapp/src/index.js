import React from 'react';
import ReactDOM from 'react-dom';
import App from './ethereumApp/components/App.jsx';
import CosmApp from './cosmApp/components/CosmApp.jsx';
import { Provider } from 'react-redux';
import { store as ethStore } from './ethereumApp/store';
import { store as cosmStore } from './cosmApp/store';

import {
    BrowserRouter,
    Routes,
    Route,
    Link,
    useNavigate
} from "react-router-dom";

const SelectNetwork = () => {
    const navigate = useNavigate();

    return (
        <>
            <h3>Select Network</h3>
            <button className='big-button animated' onClick={() => navigate("/terra")} >
                Terra
            </button>
            <button className='big-button animated' onClick={() => navigate("/eth")} >
                Ethereum
            </button>
        </>
    )
}

ReactDOM.render(
    <React.StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<SelectNetwork />} />
                <Route path="/eth" element={
                    <>
                        <Provider store={ethStore}>
                            <App />
                        </Provider>
                    </>
                } />
                <Route path="/terra" element={
                    <>
                        <Provider store={cosmStore}>
                            <CosmApp />
                        </Provider>
                    </>
                } />
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
    document.getElementById('root')
);