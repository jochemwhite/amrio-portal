"use client";

import React, { useState, useCallback } from "react";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import { Setup } from "./setup";

interface Setup2faProps {
  onSuccess: () => void;
}

export default function Setup2fa({ onSuccess }: Setup2faProps) {
  const [open, setOpen] = useState(false);

  const handleSetupSuccess = useCallback(() => {
    setOpen(false);
    onSuccess();
  }, [onSuccess]);

  const handleCloseModal = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Setup 2FA</Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Enroll MFA"
        description="Protect your account with two-factor authentication"
      >
        {open && <Setup closeModal={handleCloseModal} onSuccess={handleSetupSuccess} />}
      </Modal>
    </>
  );
}
