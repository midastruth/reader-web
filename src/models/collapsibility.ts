import { StaticBreakpoints } from "./staticBreakpoints";

export type Collapsibility = boolean | { [key in StaticBreakpoints]?: number | "all" };