import { DockTypes } from "@/models/docking";
import { SheetTypes } from "@/models/sheets";
import { BreakpointsMap, StaticBreakpoints } from "@/models/staticBreakpoints";

export const makeBreakpointsMap = <T extends BreakpointsMap>({
  defaultValue,
  fromEnum,
  pref,
  disabledValue
}: {
  defaultValue: SheetTypes | DockTypes,
  fromEnum: typeof SheetTypes | typeof DockTypes,
  pref?: T | boolean,
  disabledValue?: SheetTypes | DockTypes
}
): Required<T> => {
  const isValidType = (t: string) => {
    return Object.values(fromEnum).includes(t as keyof typeof fromEnum);
  };

  const breakpointsMap = {
    [StaticBreakpoints.compact]: defaultValue,
    [StaticBreakpoints.medium]: defaultValue,
    [StaticBreakpoints.expanded]: defaultValue,
    [StaticBreakpoints.large]: defaultValue,
    [StaticBreakpoints.xLarge]: defaultValue
  };

  if (typeof pref === "boolean" || pref instanceof Boolean) {
    if (!pref && disabledValue) {
      for (const key in breakpointsMap) {
        Object.defineProperty(breakpointsMap, key, {
          value: disabledValue
        })
      }
    }
  } else if (typeof pref === "string" && isValidType(pref)) {
    for (const key in breakpointsMap) {
      Object.defineProperty(breakpointsMap, key, {
        value: pref
      })
    }
  } else if (typeof pref === "object") {
    Object.entries(pref).forEach(([ key, value ]) => {
      if (value && isValidType(value)) {
        Object.defineProperty(breakpointsMap, key, {
          value: value
        });
      }
    })
  };
  
  return breakpointsMap as Required<T>;
}