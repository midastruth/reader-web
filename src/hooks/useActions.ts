import { ActionsStateKeys, IActionStateObject } from "@/models/state/actionsState";
import { DockingKeys } from "@/models/docking";

import { useAppSelector } from "@/lib/hooks";

export const useActions = () => {
  const actions = useAppSelector(state => state.actions.keys);

  const findOpen = () => {
    const open: ActionsStateKeys[] = [];

    (Object.entries(actions) as [ActionsStateKeys, IActionStateObject][]).forEach(([ key, value ]) => { 
      if (value.isOpen) open.push(key);
    } );

    return open;
  }

  const anyOpen = () => {
    return Object.values(actions).some((value: IActionStateObject) => value.isOpen);
  }

  const isOpen = (key?: ActionsStateKeys | null) => {
    if (key) {
      if (actions[key].isOpen === null) {
        return false;
      } else {
        return actions[key].isOpen
      }
    }
    return false;
  }

  const findDocked = () => {
    const docked: ActionsStateKeys[] = [];

    (Object.entries(actions) as [ActionsStateKeys, IActionStateObject][]).forEach(([ key, value ]) => { 
      if (value.docking === DockingKeys.start || value.docking === DockingKeys.end) docked.push(key);
    } );

    return docked;
  }

  const anyDocked = () => {
    return Object.values(actions).some((value: IActionStateObject) => { 
      if (value.docking === DockingKeys.start || value.docking === DockingKeys.end) return true;
    } );
  }

  const isDocked = (key?: ActionsStateKeys | null) => {
    return key 
      ? (actions[key].docking === DockingKeys.start || actions[key].docking === DockingKeys.end)
      : false;
  }

  const whichDocked = (key?: ActionsStateKeys | null) => {
    return key 
      ? actions[key].docking
      : null;
  }

  const getDockedWidth = (key?: ActionsStateKeys | null) => {
    return key && actions[key].dockedWidth || undefined;
  }

  const everyOpenDocked = () => {
    const opens = findOpen();
    
    return opens.every((key) => {
      return isDocked(key);
    });
  }

  return {
    findOpen,
    anyOpen,
    isOpen,
    findDocked, 
    anyDocked,
    isDocked,
    whichDocked,
    getDockedWidth,
    everyOpenDocked
  }
}