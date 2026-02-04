"use client";

import { useCallback, useEffect, useRef } from "react";
import type { InjectableFontResources } from "@/preferences/services/fonts";
import type { ILinkInjectable, IUrlInjectable, IBlobInjectable } from "@readium/navigator";

type FontResource = (ILinkInjectable & IUrlInjectable) | (ILinkInjectable & IBlobInjectable);

export const useFonts = (fontResources?: InjectableFontResources | null) => {
  const injectedElementsRef = useRef<{
    prepend: HTMLElement[];
    append: HTMLElement[];
  }>({
    prepend: [],
    append: []
  });

  const createLinkElement = useCallback((resource: FontResource): HTMLLinkElement => {
    const link = document.createElement("link");
    link.rel = resource.rel;
    link.as = resource.as;
    
    if ("url" in resource) {
      link.href = resource.url;
    }
    
    if ("attributes" in resource && resource.attributes) {
      Object.entries(resource.attributes).forEach(([key, value]) => {
        link.setAttribute(key, value as string);
      });
    }
    
    return link;
  }, []);

  const createStyleElement = useCallback((resource: FontResource): HTMLStyleElement => {
    const style = document.createElement("style");
    
    if ("blob" in resource && resource.blob) {
      resource.blob.text().then(text => {
        style.textContent = text;
      }).catch(error => {
        console.error("Error reading blob content:", error);
      });
    }
    
    return style;
  }, []);

  const removeInjectedElements = useCallback(() => {
    const { prepend, append } = injectedElementsRef.current;
    
    [...prepend, ...append].forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    injectedElementsRef.current = {
      prepend: [],
      append: []
    };
  }, []);

  const injectFontResources = useCallback((resources: InjectableFontResources | null) => {
    if (typeof document === "undefined") return;
    
    removeInjectedElements();
    
    if (!resources) return;
    
    const { prepend, append } = resources;
    const injectedElements = injectedElementsRef.current;
    
    prepend.forEach(resource => {
      const element = "blob" in resource 
        ? createStyleElement(resource)
        : createLinkElement(resource);
      
      document.head.insertBefore(element, document.head.firstChild);
      injectedElements.prepend.push(element);
    });
    
    append.forEach(resource => {
      const element = "blob" in resource 
        ? createStyleElement(resource)
        : createLinkElement(resource);
      
      document.head.appendChild(element);
      injectedElements.append.push(element);
    });
  }, [createLinkElement, createStyleElement, removeInjectedElements]);

  useEffect(() => {
    injectFontResources(fontResources || null);
    
    return () => {
      removeInjectedElements();
    };
  }, [fontResources, injectFontResources, removeInjectedElements]);

  return {
    injectFontResources,
    removeInjectedElements
  };
};