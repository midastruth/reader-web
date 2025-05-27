import { ReactNode } from "react";

import Locale from "../resources/locales/en.json";

import readerLoaderStyles from "./assets/styles/readerLoader.module.css";

// Since we are removing readerLoader entirely, no need for aria-hidden={ !isLoading }
// No need for a label either since we are using the string for the animation
export const Loader = ({ isLoading, children }: { isLoading: boolean, children: ReactNode }) => {
  return (
    <>
    <div 
      className={ readerLoaderStyles.readerLoaderWrapper } 
      aria-busy={ isLoading } 
      aria-live="polite"
    >
      { isLoading && 
        <div className={ readerLoaderStyles.readerLoader}>
          { Locale.reader.app.loading }
        </div> 
      }
      { children }
    </div>
    </>
  )
}