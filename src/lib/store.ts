import { IActionsState } from "@/models/state/actionsState";
import { DockingKeys } from "@/models/docking";

import { combineReducers, configureStore } from "@reduxjs/toolkit";
import readerReducer from "@/lib/readerReducer";
import settingsReducer from "@/lib/settingsReducer";
import themeReducer from "@/lib/themeReducer";
import actionsReducer from "@/lib/actionsReducer";
import publicationReducer from "./publicationReducer";

import debounce from "debounce";

const updateActionsState = (state: IActionsState) => {
  const updatedKeys = Object.fromEntries(
    Object.entries(state.keys).map(([key, value]) => [
      key,
      {
        ...value,
        isOpen: value.docking === DockingKeys.transient || value.docking === null && value.isOpen === true ? false : value.isOpen,
      },
    ])
  );

  return {
    ...state,
    keys: updatedKeys,
    overflow: {}
  };
};

const loadState = () => {
  try {
    const serializedState = localStorage.getItem("thorium-web-state");
    if (serializedState === null) {
      return { actions: undefined, settings: undefined, theming: undefined };
    }
    const deserializedState = JSON.parse(serializedState);
    deserializedState.actions = updateActionsState(deserializedState.actions);
    return deserializedState;
  } catch (err) {
    return { actions: undefined, settings: undefined, theming: undefined };
  }
};

const saveState = (state: object) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem("thorium-web-state", serializedState);
  } catch (err) {
    console.error(err);
  }
};

export const makeStore = () => {
  const rootReducer = combineReducers({
    reader: readerReducer,
    settings: settingsReducer,
    theming: themeReducer,
    actions: actionsReducer,
    publication: publicationReducer
  });

  const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
      actions: loadState().actions,
      settings: loadState().settings,
      theming: loadState().theming
    },
  });

  const saveStateDebounced = debounce(() => {
    saveState(store.getState());
  }, 500);

  store.subscribe(saveStateDebounced);

  return store;
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];