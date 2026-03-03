import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { Modal, ModalContent, ModalHeader } from "./Modal";

interface PdfDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PdfDialog: React.FC<PdfDialogProps> = ({ isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const langCode = language === "cs" ? "cz" : "en";
  const pdfUrl =
    `https://nasynufyz.ufyz.feec.vutbr.cz/labweb/manual/Uloha26/manual_${langCode}.pdf`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="own"
      className="w-[90vw] h-[90vh] max-w-[90vw] max-h-[90vh]"
    >
      <ModalHeader title={t.pdfDialogTitle} onClose={onClose} />
      <ModalContent className="p-0 flex-1 overflow-hidden">
        <div className="w-full h-full flex items-center justify-center bg-slate-50">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title={t.pdfDialogIframeTitle}
          />
        </div>
      </ModalContent>
    </Modal>
  );
};
