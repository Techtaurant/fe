"use client";

import { useState } from "react";
import AppModal from "../common/AppModal";
import SettingsPanel from "./SettingsPanel";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);

  const handleClose = () => {
    setIsProfileEditModalOpen(false);
    onClose();
  };

  return (
    <AppModal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnBackdrop={!isProfileEditModalOpen}
      closeOnEscape={!isProfileEditModalOpen}
      panelClassName="w-full max-w-[660px]"
    >
      <SettingsPanel
        onClose={handleClose}
        onProfileEditOpenChange={setIsProfileEditModalOpen}
      />
    </AppModal>
  );
}
