"use client";

import React, { cloneElement, isValidElement } from "react";

import classicStyles from "./assets/styles/thorium-web.publicationGrid.module.css";
import shelfStyles from "./assets/styles/thorium-web.publicationGrid.shelf.module.css";

import { ThGrid } from "@/core/Components";
import { Link } from "react-aria-components";

import classNames from "classnames";

export const DefaultImage = ({
  src,
  alt = "",
  className = classicStyles.image
}: {
  src: string;
  alt?: string;
  className?: string;
}) => (
  <img
    src={ src }
    alt={ alt }
    className={ className }
    loading="lazy"
  />
);

export interface Publication {
  title: string;
  author: string;
  cover: string;
  url: string;
  rendition?: string;
}

export interface PublicationGridProps {
  publications: Publication[];
  columnWidth?: number;
  gap?: string;
  variant?: "classic" | "shelf";
  renderCover?: (publication: Publication) => React.ReactElement<React.ImgHTMLAttributes<HTMLImageElement>>;
}

export const PublicationGrid = ({
  publications,
  columnWidth,
  gap,
  variant = "classic",
  renderCover = (publication) => (
    <DefaultImage
      src={ publication.cover }
      alt=""
    />
  ),
}: PublicationGridProps) => {
  const styles = variant === "shelf" ? shelfStyles : classicStyles;
  const defaultColumnWidth = variant === "shelf" ? 140 : 400;
  const defaultGap = variant === "shelf" ? "1.25rem" : "1.5rem";

  const renderCoverWithClass = (publication: Publication) => {
    const cover = renderCover(publication);

    if (!isValidElement<React.ImgHTMLAttributes<HTMLImageElement>>(cover)) {
      return (
        <DefaultImage
          src={ publication.cover }
          alt=""
          className={ styles.image }
        />
      );
    }

    return cloneElement(cover, {
      className: classNames(
        styles.image,
        cover.props.className
      )
    });
  };

  return (
    <ThGrid
      className={ styles.wrapper }
      items={ publications }
      columnWidth={ columnWidth ?? defaultColumnWidth }
      gap={ gap ?? defaultGap }
      renderItem={ (publication, index) => (
        <Link
          href={ publication.url }
          key={ index }
          className={ styles.card }
        >
          <figure className={ styles.cover }>
            { renderCoverWithClass(publication) }
          </figure>
          <div className={ styles.info }>
            <h2 className={ styles.title }>
              { publication.title }
            </h2>
            <p className={ styles.author }>
              { publication.author }
            </p>
            { publication.rendition && (
              <p className={ styles.rendition }>
                { publication.rendition }
              </p>
            ) }
          </div>
        </Link>
      ) }
    />
  );
};
