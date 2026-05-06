"use client";

import AppModal from "../common/AppModal";
import SettingsPanel from "./SettingsPanel";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="w-full max-w-[660px]"
    >
      <SettingsPanel onClose={onClose} />
    </AppModal>
  );
}
