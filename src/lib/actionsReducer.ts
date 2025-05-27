import { createSlice } from "@reduxjs/toolkit";

import { ActionKeys } from "@/models/actions";
import { ActionsStateKeys, IActionOverflowOpenPayload, IActionsState, IActionStateDockPayload, IActionStateOpenPayload, IActionStateSlotPayload, IActionStateSlotWidthPayload, IActionStateTogglePayload } from "@/models/state/actionsState";
import { DockingKeys } from "@/models/docking";

const initialState: IActionsState = {
  dock: {
    [DockingKeys.start]: {
      actionKey: null,
      active: false,
      collapsed: false
    },
    [DockingKeys.end]: {
      actionKey: null,
      active: false,
      collapsed: false
    }
  },
  keys: {
    [ActionKeys.toc]: {
      isOpen: null,
      docking: null
    },
    [ActionKeys.settings]: {
      isOpen: null,
      docking: null
    },
    [ActionKeys.jumpToPosition]: {
      isOpen: null,
      docking: null
    },
    [ActionKeys.layoutStrategy]: {
      isOpen: null,
      docking: null
    }
  },
  overflow: {}
}

export const actionsSlice = createSlice({
  name: "actions",
  initialState,
  reducers: {
    dockAction: (state, action: IActionStateDockPayload) => {
      switch (action.payload.key) {
        case ActionKeys.jumpToPosition:
        case ActionKeys.toc:
        case ActionKeys.settings:
        case ActionKeys.layoutStrategy:
          // The user should be able to override the dock slot
          // so we override the previous value, and sync 
          // any other action with the same docking key

          switch(action.payload.dockingKey) {
            case DockingKeys.start:
              // We need to find if any other action has the same docking key. 
              // If it does, we also have to close it so that its transient sheet 
              // doesn’t pop over on the screen when it’s replaced
              for (const key in state.keys) {
                if (state.keys[key as ActionsStateKeys].docking === action.payload.dockingKey) {
                  state.keys[key as ActionsStateKeys] = { 
                    ...state.keys[key as ActionsStateKeys],
                    docking: DockingKeys.transient,
                    isOpen: false
                  };
                }
              }

              // We need to populate the docking slot
              state.dock[DockingKeys.start] = {
                ...state.dock[DockingKeys.start],
                actionKey: action.payload.key
              }
              // And remove it from the other one
              if (state.dock[DockingKeys.end].actionKey === action.payload.key) {
                state.dock[DockingKeys.end] = {
                  ...state.dock[DockingKeys.end],
                  actionKey: null
                }
              }
              break;

            case DockingKeys.end:
              // We need to find if any other action has the same docking key. 
              // If it does, we also have to close it so that its transient sheet 
              // doesn’t pop over on the screen when it’s replaced
              for (const key in state.keys) {
                if (state.keys[key as ActionsStateKeys].docking === action.payload.dockingKey) {
                  state.keys[key as ActionsStateKeys] = { 
                    ...state.keys[key as ActionsStateKeys],
                    docking: DockingKeys.transient,
                    isOpen: false
                  };
                }
              }

              // We need to populate the docking slot
              state.dock[DockingKeys.end] = {
                ...state.dock[DockingKeys.end],
                actionKey: action.payload.key
              }
              // And remove it from the other one
              if (state.dock[DockingKeys.start].actionKey === action.payload.key) {
                state.dock[DockingKeys.start] = {
                  ...state.dock[DockingKeys.start],
                  actionKey: null
                }
              }
              break;

            // We don’t need to sync another action
            case DockingKeys.transient:
            default: 
              // We need to empty the docking slot
              if (state.dock[DockingKeys.start].actionKey === action.payload.key) {
                state.dock[DockingKeys.start] = {
                  ...state.dock[DockingKeys.start],
                  actionKey: null
                }
              }
              if (state.dock[DockingKeys.end].actionKey === action.payload.key) {
                state.dock[DockingKeys.end] = {
                  ...state.dock[DockingKeys.end],
                  actionKey: null
                }
              }            
              break;
          }
          break; 
        default:
          break;
      }
      state.keys[action.payload.key] = { 
        ...state.keys[action.payload.key],
        docking: action.payload.dockingKey 
      };
    },
    setActionOpen: (state, action: IActionStateOpenPayload) => {      
      switch (action.payload.key) {
        case ActionKeys.jumpToPosition:
        case ActionKeys.toc:
        case ActionKeys.settings:
        case ActionKeys.layoutStrategy:
          // If the action is docked and set Open, we must take care of 
          // the dock panel’s collapsibility. Otherwise we end up with bugs 
          // i.e. user has to click/tap action icon twice to open, 
          const dockingKey = state.keys[action.payload.key].docking;
          if (
              !action.payload.isOpen && 
              dockingKey !== null && 
              dockingKey !== DockingKeys.transient &&
              state.dock[dockingKey].actionKey === action.payload.key &&
              state.dock[dockingKey].active &&
              state.dock[dockingKey].collapsed
            ) {
              state.dock[dockingKey] = {
                ...state.dock[dockingKey],
                collapsed: false
              }
          } else {
            state.keys[action.payload.key] = {
              ...state.keys[action.payload.key],
              isOpen: action.payload.isOpen 
            };
          }

          break;
        default:
          break;
      }
    },
    toggleActionOpen: (state, action: IActionStateTogglePayload) => {
      switch (action.payload.key) {
        case ActionKeys.jumpToPosition:
        case ActionKeys.toc:
        case ActionKeys.settings:
          const payload = {
            key: action.payload.key,
            isOpen: state.keys[action.payload.key].isOpen ? !state.keys[action.payload.key].isOpen : true
          };
          actionsSlice.caseReducers.setActionOpen(state, {
            type: "toggleActionOpen",
            payload: payload
          });
          break;
        default:
          break; 
      }
    },
    setOverflow: (state, action: IActionOverflowOpenPayload) => {
      state.overflow[action.payload.key] = {
        ...state.overflow[action.payload.key],
        isOpen: action.payload.isOpen 
      }
    },
    activateDockPanel: (state, action: IActionStateSlotPayload) => {
      state.dock[action.payload] = {
        ...state.dock[action.payload],
        active: true
      }
    },
    deactivateDockPanel: (state, action: IActionStateSlotPayload) => {
      state.dock[action.payload] = {
        ...state.dock[action.payload],
        active: false
      }
    },
    collapseDockPanel: (state, action: IActionStateSlotPayload) => {
      state.dock[action.payload] = {
        ...state.dock[action.payload],
        collapsed: true
      }
    },
    expandDockPanel: (state, action: IActionStateSlotPayload) => {
      state.dock[action.payload] = {
        ...state.dock[action.payload],
        collapsed: false
      }
    },
    setDockPanelWidth: (state, action: IActionStateSlotWidthPayload) => {
      // Copy the value in the action state 
      // in case we do something with it later.

      const key = state.dock[action.payload.key].actionKey;
      if (key) {
        state.keys[key] = {
          ...state.keys[key],
          dockedWidth: action.payload.width
        }
      }

      // We only care if it’s populated.
      if (state.dock[action.payload.key] !== null) {
        state.dock[action.payload.key] = {
          ...state.dock[action.payload.key],
          width: action.payload.width
        }
      }
    }
  }
})

export const { 
  dockAction, 
  setActionOpen, 
  toggleActionOpen, 
  setOverflow, 
  activateDockPanel, 
  deactivateDockPanel, 
  collapseDockPanel,
  expandDockPanel, 
  setDockPanelWidth
} = actionsSlice.actions;

export default actionsSlice.reducer;