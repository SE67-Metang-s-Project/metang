"use client";

import { useState, type ImgHTMLAttributes, type SyntheticEvent } from "react";

type ImageWithSkeletonProps = ImgHTMLAttributes<HTMLImageElement> & {
  containerClassName?: string;
};

export default function ImageWithSkeleton(props: ImageWithSkeletonProps) {
  return <ImageWithSkeletonContent key={props.src} {...props} />;
}

function ImageWithSkeletonContent({
  alt,
  className,
  containerClassName = "",
  onError,
  onLoad,
  src,
  ...props
}: ImageWithSkeletonProps) {
  const [isLoading, setIsLoading] = useState(true);

  function finishLoading(event: SyntheticEvent<HTMLImageElement>) {
    setIsLoading(false);
    onLoad?.(event);
  }

  function handleError(event: SyntheticEvent<HTMLImageElement>) {
    setIsLoading(false);
    onError?.(event);
  }

  return (
    <span
      aria-busy={isLoading}
      className={`relative block overflow-hidden ${isLoading ? "bg-slate-100" : "bg-transparent"} ${containerClassName}`}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100"
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        {...props}
        alt={alt}
        className={`relative block transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"} ${className ?? ""}`}
        onError={handleError}
        onLoad={finishLoading}
        src={src}
      />
    </span>
  );
}
