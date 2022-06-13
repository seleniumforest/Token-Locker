import { useState } from "react";

export function useModal() {
    const [open, setOpen] = useState(false);
    const onOpenModal = () => setOpen(true);
    const onCloseModal = () => setOpen(false);

    return {
        open,
        setOpen,
        onOpenModal,
        onCloseModal
    }
}