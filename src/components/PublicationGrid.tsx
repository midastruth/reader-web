"use client";

import React, { cloneElement, isValidElement } from "react";

import publicationGridStyles from "./assets/styles/thorium-web.publicationGrid.module.css";

import { ThGrid } from "@/core/Components";
import { Link } from "react-aria-components";

import classNames from "classnames";

export const DefaultImage = ({
  src,
  alt = ""
}: {
  src: string;
  alt?: string;
}) => (
  <img
    src={ src }
    alt={ alt }
    className={ publicationGridStyles.publicationImage }
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
  renderCover?: (publication: Publication) => React.ReactElement<React.ImgHTMLAttributes<HTMLImageElement>>;
}

export const PublicationGrid = ({ 
  publications,
  columnWidth = 400,
  gap = "1.5rem",
  renderCover = (publication) => (
    <DefaultImage
      src={ publication.cover }
      alt=""
    />
  ),
}: PublicationGridProps) => {
  const renderCoverWithClass = (publication: Publication) => {
    const cover = renderCover(publication);
    
    if (!isValidElement<React.ImgHTMLAttributes<HTMLImageElement>>(cover)) {
      return (
        <DefaultImage
          src={ publication.cover }
          alt=""
        />
      );
    }

    return cloneElement(cover, {
      className: classNames(
        publicationGridStyles.publicationImage,
        cover.props.className
      )
    });
  };

  return (
    <ThGrid
      className={ publicationGridStyles.publicationGrid }
      items={ publications }
      columnWidth={ columnWidth }
      gap={ gap }
      renderItem={ (publication, index) => (
        <Link
          href={ publication.url }
          key={ index }
          className={ publicationGridStyles.publicationCard }
        >
          <figure className={ publicationGridStyles.publicationCover }>
            { renderCoverWithClass(publication) }
          </figure>
          <div className={ publicationGridStyles.publicationInfo }>
            <h2 className={ publicationGridStyles.publicationTitle }>
              { publication.title }
            </h2>
            <p className={ publicationGridStyles.publicationAuthor }>
              { publication.author }
            </p>
            { publication.rendition && (
              <p className={ publicationGridStyles.publicationRendition }>
                { publication.rendition }
              </p>
            ) }
          </div>
        </Link>
      ) }
    />
  );
};