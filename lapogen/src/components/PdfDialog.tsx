import React from "react";
import { useLanguage } from "../context/LanguageContext";
import { Modal, ModalContent, ModalHeader } from "./Modal";

interface PdfDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PdfDialog: React.FC<PdfDialogProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  // Placeholder PDF URL - replace with actual URL later
  const pdfUrl =
    "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

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
