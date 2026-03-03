"use client";

import {
  Dialog,
  DialogContent,
  DialogOverlay,
  DialogTitle,
} from "@radix-ui/react-dialog";
import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

export interface IModalProps extends React.BaseHTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  modal?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "full" | "own";
}

export const Modal: React.FC<IModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
  modal,
  size = "lg",
}) => {
  return (
    <Dialog modal={modal} open={isOpen} onOpenChange={onClose}>
      <DialogOverlay className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[2px]" />
      <DialogContent
        data-gelato-modal
        className="fixed inset-0 z-50 overflow-y-auto"
        aria-describedby={undefined}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="h-screen flex justify-center items-center p-4">
          <div
            className={clsx(
              {
                "max-h-[250px] min-h-[300px] w-[400px] mx-xl": size === "sm",
                "w-[60vw] max-w-[688px] max-h-[1200px] mx-xl": size === "md",
                "w-[100vw] h-[100vh]": ["lg", "xl", "full"].includes(size),
                "tablet:w-[80vw] tablet:h-[70%] tablet:max-w-[560px] tablet:max-h-[700px]":
                  size === "lg",
                "tablet:w-[80vw] tablet:h-[70%] tablet:max-w-[800px] tablet:max-h-[700px]":
                  size === "xl",
                "min-h-[200px] max-h-[80vh]": size !== "full" && size !== "own",
              },
              "bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden relative shadow-2xl",
              className
            )}
          >
            {children}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export interface IModalHeaderProps
  extends React.BaseHTMLAttributes<HTMLDivElement> {
  className?: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: "primary" | "warning" | "error" | "info";
  onClose: () => void;
  disableClose?: boolean;
}

export const ModalHeader: React.FC<IModalHeaderProps> = ({
  title,
  onClose,
  className,
  subtitle,
  icon,
  variant = "primary",
  disableClose = false,
}) => {
  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <div
      className={twMerge(
        "relative w-full px-6 py-4 border-b border-slate-200 bg-white",
        className
      )}
    >
      <div
        className={clsx("basis-full flex flex-col gap-1", {
          "mt-20": icon,
          "mt-0": !icon,
        })}
      >
        <DialogTitle
          className={"text-lg font-semibold text-slate-900 z-10"}
          ref={ref}
        >
          {title}
        </DialogTitle>
        {subtitle && (
          <span className={"text-sm text-slate-600"}>{subtitle}</span>
        )}
      </div>
      {icon && (
        <>
          <div
            className={clsx(
              "absolute top-0 left-0 mt-4 ml-4 p-2 rounded-full",
              {
                "border border-slate-200 bg-white": variant === "primary",
                "bg-amber-50 border border-amber-200": variant === "warning",
                "bg-rose-50 border border-rose-200": variant === "error",
                "bg-indigo-50 border border-indigo-200": variant === "info",
              }
            )}
          >
            {icon}
          </div>
        </>
      )}
      {!disableClose && (
        <button
          aria-label="Close"
          className="group absolute top-4 right-4 z-20 h-9 w-9 inline-flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 focus:outline-none"
          onClick={() => onClose()}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
          >
            <path
              fillRule="evenodd"
              d="M10 8.586 4.293 2.879A1 1 0 0 0 2.88 4.293L8.586 10l-5.707 5.707a1 1 0 1 0 1.414 1.414L10 11.414l5.707 5.707a1 1 0 0 0 1.414-1.414L11.414 10l5.707-5.707A1 1 0 0 0 15.707 2.88L10 8.586Z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export interface IModalActionsProps
  extends React.BaseHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

export const ModalActions: React.FC<IModalActionsProps> = ({
  className,
  children,
}) => {
  return (
    <div
      className={twMerge("w-full mt-auto flex gap-3 p-4 bg-white", className)}
    >
      {children}
    </div>
  );
};

export interface IModalContentProps
  extends React.BaseHTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const ModalContent: React.FC<IModalContentProps> = ({
  className,
  children,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasScrollbar, setHasScrollbar] = useState(false);

  const checkForScrollbar = useCallback(() => {
    if (contentRef.current) {
      const hasVerticalScrollbar =
        contentRef.current.scrollHeight > contentRef.current.clientHeight;
      setHasScrollbar(hasVerticalScrollbar);
    }
  }, []);

  useEffect(() => {
    checkForScrollbar();
    window.addEventListener("resize", checkForScrollbar);
    return () => {
      window.removeEventListener("resize", checkForScrollbar);
    };
  }, [checkForScrollbar]);

  useEffect(() => {
    const observer = new MutationObserver(checkForScrollbar);
    if (contentRef.current) {
      observer.observe(contentRef.current, { childList: true, subtree: true });
    }
    return () => observer.disconnect();
  }, [checkForScrollbar]);

  return (
    <div
      ref={contentRef}
      className={twMerge(
        "flex-grow px-6 overflow-y-auto overflow-x-hidden text-clip z-10 bg-white pb-2",
        hasScrollbar && "border-t border-b border-slate-200",
        className
      )}
      style={{ maxHeight: "calc(100% - 90px)" }}
    >
      {children}
    </div>
  );
};
