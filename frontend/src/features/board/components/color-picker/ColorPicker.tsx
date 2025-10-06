// ColorPicker.tsx
type ColorOption = {
    id: string; // usamos la *misma* clase como id para simplificar
    className: string; // "blue-500"
    label: string;
};

const COLORS: ColorOption[] = [
    { id: "red-500", className: "red-500", label: "Rojo" },
    { id: "green-500", className: "green-500", label: "Verde" },
    { id: "blue-500", className: "blue-500", label: "Azul" },
    { id: "yellow-500", className: "yellow-500", label: "Amarillo" },
    { id: "purple-500", className: "purple-500", label: "Violeta" },
    { id: "pink-500", className: "pink-500", label: "Rosa" },
];

type Props = {
    value: string | undefined; // ej: "blue-500"
    onChange: (id: string, twClass: string) => void;
    name?: string;
};

export function ColorPicker({ value, onChange, name = "color" }: Props) {
    const selected = COLORS.find((c) => c.id === value);

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor={name}>
                Color
            </label>

            <div role="radiogroup" aria-labelledby={`${name}-label`} className="mt-2">
                <span id={`${name}-label`} className="sr-only">
                    Elegir color
                </span>

                {COLORS.map((c) => {
                    const selectedItem = value === c.id;
                    return (
                        <button
                            key={c.id}
                            type="button"
                            role="radio"
                            aria-checked={selectedItem}
                            aria-label={c.label}
                            onClick={() => onChange(c.id, c.className)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    onChange(c.id, c.className);
                                }
                            }}
                            className={[
                                "inline-flex items-center justify-center",
                                "w-6 h-6 rounded-full mr-2 cursor-pointer",
                                "bg-" + c.className,
                                selectedItem ? "ring-2 ring-offset-2 ring-gray-900" : "ring-0",
                            ].join(" ")}
                        />
                    );
                })}
            </div>

            {value && <input type="hidden" name={name} value={selected?.className ?? ""} />}
        </div>
    );
}
