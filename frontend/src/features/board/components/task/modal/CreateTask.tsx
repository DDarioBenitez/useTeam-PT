import { useState } from "react";
import { X as XIcon } from "lucide-react";
import { ColorPicker } from "../../color-picker/ColorPicker";

type NewTaskInput = {
    title: string;
    description: string;
    tag: string;
    color: string; // ej: "blue-500"
};

interface CreateTaskProps {
    onClose: () => void;
    onSubmit?: (input: NewTaskInput) => void;
}

const CreateTaskModal = ({ onClose, onSubmit }: CreateTaskProps) => {
    const [colorId, setColorId] = useState<string>("blue-500");
    const [sending, setSending] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const payload: NewTaskInput = {
            title: String(fd.get("title") || ""),
            description: String(fd.get("description") || ""),
            tag: String(fd.get("tag") || ""),
            color: colorId,
        };

        try {
            setSending(true);
            onSubmit?.(payload); // <<— llama al padre
            onClose();
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-black/15 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-md w-96">
                <div className="flex items-center justify-between mb-4 border-b pb-2 p-4 border-gray-200">
                    <h2 className="text-lg font-semibold">Create a New Task</h2>
                    <button type="button" onClick={onClose} className="p-1 rounded hover:bg-gray-100">
                        <XIcon className="h-4 w-4" />
                    </button>
                </div>

                <form className="p-4 space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="title">
                            Title
                        </label>
                        <input className="mt-1 block w-full border border-gray-300 rounded-md p-2" type="text" id="title" name="title" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="description">
                            Description
                        </label>
                        <textarea className="mt-1 block w-full border border-gray-300 rounded-md p-2" id="description" name="description" required />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700" htmlFor="tag">
                            Tag
                        </label>
                        <input className="mt-1 block w-full border border-gray-300 rounded-md p-2" type="text" id="tag" name="tag" required />
                    </div>

                    <ColorPicker
                        value={colorId}
                        onChange={(id) => setColorId(id)} // id debería ser "blue-500", "red-500", etc.
                    />

                    <button
                        className="mt-2 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-60"
                        type="submit"
                        disabled={sending}
                    >
                        {sending ? "Creating..." : "Create Task"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateTaskModal;
