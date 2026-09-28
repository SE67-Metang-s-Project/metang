"use client";

import { useState, type ImgHTMLAttributes, type SyntheticEvent } from "react";

type ImageWithSkeletonProps = ImgHTMLAttributes<HTMLImageElement> & {
  containerClassName?: string;
  loadingAspectRatio?: number;
  loadingContainerClassName?: string;
  loadingImageClassName?: string;
};

const BASE_PATH = "/metang";

function resolveImageSrc(src?: string): string | undefined {
  if (!src) return src;
  if (
    src.startsWith("/") &&
    !src.startsWith("//") &&
    !src.startsWith(`${BASE_PATH}/`) &&
    src !== BASE_PATH
  ) {
    return `${BASE_PATH}${src}`;
  }
  return src;
}

export default function ImageWithSkeleton(props: ImageWithSkeletonProps) {
  const resolvedSrc = typeof props.src === "string" ? resolveImageSrc(props.src) : props.src;
  return (
    <ImageWithSkeletonContent
      key={typeof resolvedSrc === "string" ? resolvedSrc : undefined}
      {...props}
      src={resolvedSrc}
    />
  );
}

function ImageWithSkeletonContent({
  alt,
  className,
  containerClassName = "",
  loadingAspectRatio,
  loadingContainerClassName = "",
  loadingImageClassName = "",
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
      className={`relative block overflow-hidden ${isLoading ? `bg-slate-100 ${loadingContainerClassName}` : "bg-transparent"} ${containerClassName}`}
      style={isLoading && loadingAspectRatio ? { aspectRatio: loadingAspectRatio } : undefined}
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
        className={`relative block transition-opacity duration-200 ${isLoading ? `opacity-0 ${loadingImageClassName}` : "opacity-100"} ${className ?? ""}`}
        onError={handleError}
        onLoad={finishLoading}
        src={src}
      />
    </span>
  );
}
