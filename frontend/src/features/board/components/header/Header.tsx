import { Share2Icon } from "lucide-react";
import { exportBacklog } from "../../../../libs/api/header";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { off, on } from "../../../../libs/sockets";
import { EVENTS } from "../../../../shared/events";

const Header = () => {
    const pendingToastIdRef = useRef<string | number | null>(null);

    async function handleExport(email: string, prevToastId?: string | number | null) {
        try {
            if (prevToastId) {
                try {
                    toast.dismiss(prevToastId);
                } catch {
                    // ignore
                }
            }
            if (pendingToastIdRef.current) {
                toast.dismiss(pendingToastIdRef.current);
            }
            pendingToastIdRef.current = toast.loading("Export requested — processing...");
            await exportBacklog({ email });
        } catch (error) {
            console.error("Export failed:", error);
            if (pendingToastIdRef.current) toast.dismiss(pendingToastIdRef.current);
            toast.error("Error requesting export");
            pendingToastIdRef.current = null;
        }
    }

    function openEmailToast() {
        const customId = toast.custom((t) => {
            return (
                <div className="w-80 p-4 bg-white rounded shadow-lg">
                    <h4 className="font-semibold mb-2">Send backlog by email</h4>
                    <EmailToastBody
                        onSubmit={(email) => {
                            handleExport(email, customId);
                        }}
                        onCancel={() => toast.dismiss(t)}
                    />
                </div>
            );
        });
    }

    function onExportCompleted() {
        try {
            if (pendingToastIdRef.current) {
                toast.dismiss(pendingToastIdRef.current);
                pendingToastIdRef.current = null;
            }
            toast.success("Export completed. Check your email.");
        } catch (err) {
            console.error("Error handling export completion:", err);
        }
    }

    useEffect(() => {
        const onNotif = (p: { message: string }) => {
            console.log("Notification:", p.message);
            if (p.message) {
                onExportCompleted();
            }
        };

        on(EVENTS.NOTIFICATION, onNotif);

        return () => {
            off(EVENTS.NOTIFICATION, onNotif);
        };
    }, []);

    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
            <h3 className="text-lg font-semibold">useTeam</h3>
            <div className="flex items-center gap-4">
                <button onClick={() => openEmailToast()} className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
                    <Share2Icon />
                </button>
            </div>
        </div>
    );
};

function EmailToastBody({ onSubmit, onCancel }: { onSubmit: (email: string) => void; onCancel: () => void }) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
            toast.error("Please enter a valid email");
            return;
        }
        try {
            setLoading(true);
            await onSubmit(email);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="w-full p-2 border rounded mb-2" />
            <div className="flex gap-2 justify-end">
                <button onClick={onCancel} className="px-3 py-1 rounded border">
                    Cancel
                </button>
                <button onClick={submit} disabled={loading} className="px-3 py-1 rounded bg-blue-500 text-white">
                    {loading ? "Sending..." : "Send"}
                </button>
            </div>
        </div>
    );
}

export default Header;
