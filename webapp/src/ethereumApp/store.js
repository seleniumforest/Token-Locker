import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import externalDataSlice from './reduxSlices/externalDataSlice';
import networkSlice from './reduxSlices/networkSlice';
import tokenSelectorSlice from './reduxSlices/tokenSelectorSlice';
import userLocksSlice from './reduxSlices/userLocksSlice';

const logger = store => next => action => {
    if (action.type) {
        console.group(action.type)
        console.info('dispatching', action)
    }
    let result = next(action)

    if (action.type) {
        console.log('next state', store.getState())
        console.groupEnd()
    }
    return result;
}

const store = configureStore({
    reducer: {
        networkSlice: networkSlice,
        tokenSelectorSlice: tokenSelectorSlice,
        externalDataSlice: externalDataSlice,
        userLocksSlice: userLocksSlice
    },
    middleware: [logger, ...getDefaultMiddleware()],
});

export { store };