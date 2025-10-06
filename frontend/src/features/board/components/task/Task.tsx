import { XIcon } from "lucide-react";
import type { TaskProps } from "../../../../types/task.type";

const Task = ({ description, tag, title, color, id, columnId, index, onDelete }: TaskProps) => {
    return (
        <div
            draggable
            onDragStart={(e) => {
                const payload = {
                    type: "task",
                    taskId: id,
                    fromColumnId: columnId,
                    fromIndex: index,
                };
                console.log("[DRAGSTART TASK]", payload);
                e.dataTransfer.setData("application/json", JSON.stringify(payload));
                e.dataTransfer.effectAllowed = "move";
            }}
            className={`p-3 flex flex-col gap-2 m-3 shadow-sm border-${color} rounded-lg bg-[#f6f7f8] border-l-4`}
        >
            <div className="flex items-center justify-between">
                <h3 className="text-md font-semibold">{title}</h3>
                <span onClick={() => onDelete?.(id)} className=" p-1 rounded hover:bg-gray-200 cursor-pointer">
                    <XIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </span>
            </div>
            <p className="text-gray-600">{description}</p>
            <div className="flex items-center justify-between gap-2">
                <span className={`text-${color} rounded-full bg-[#3b82f61a] px-2 py-1`}>{tag}</span>
            </div>
        </div>
    );
};

export default Task;
