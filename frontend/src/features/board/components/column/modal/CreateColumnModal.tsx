// CreateColumnModal.tsx
import { useEffect, useRef, useState } from "react";
import { X as XIcon } from "lucide-react";
import { ColorPicker } from "../../color-picker/ColorPicker";

interface CreateColumnModalProps {
    onClose: () => void;
    onSubmit?: (payload: { title: string; color: string }) => void; // color = "bg-...-500"
}

const CreateColumnModal = ({ onClose, onSubmit }: CreateColumnModalProps) => {
    const dialogRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const headingId = "create-column-title";

    // Estado: guardamos directamente la clase Tailwind
    const [colorId, setColorId] = useState<string>("bg-blue-500");
    const [color, setColor] = useState<string>("bg-blue-500");

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose]);

    useEffect(() => {
        titleRef.current?.focus();
    }, []);

    function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
        if (e.target === e.currentTarget) onClose();
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/15" onClick={handleOverlayClick}>
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={headingId}
                className="w-96 rounded-lg bg-white shadow-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between border-b border-gray-200 p-4 pb-2">
                    <h2 id={headingId} className="text-lg font-semibold">
                        Create a New Column
                    </h2>
                    <button type="button" onClick={onClose} className="rounded p-1 hover:bg-gray-100" aria-label="Close">
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>

                <form
                    className="space-y-4 p-4"
                    onSubmit={(e) => {
                        e.preventDefault();
                        const title = titleRef.current?.value?.trim();
                        if (title && color && onSubmit) {
                            onSubmit({ title, color }); // 👈 enviás la *clase* Tailwind
                        }
                        onClose();
                    }}
                >
                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="title">
                            Title
                        </label>
                        <input
                            ref={titleRef}
                            className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                            type="text"
                            id="title"
                            name="title"
                            required
                        />
                    </div>

                    <ColorPicker
                        name="color"
                        value={colorId}
                        onChange={(id, twClass) => {
                            setColorId(id); // ej: "bg-blue-500"
                            setColor(twClass); // ej: "bg-blue-500" (la misma clase)
                        }}
                    />

                    <button className="mt-2 w-full rounded-md bg-blue-600 py-2 text-white hover:bg-blue-700" type="submit">
                        Create Column
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateColumnModal;
