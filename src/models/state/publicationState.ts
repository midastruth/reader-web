import { IProgression } from "../progression";
import { TocItem } from "../toc";

export interface IPublicationState {
  runningHead?: string;
  isFXL: boolean;
  isRTL: boolean;
  progression: IProgression;
  atPublicationStart: boolean;
  atPublicationEnd: boolean;
  tocTree?: TocItem[];
  tocEntry?: string;
}