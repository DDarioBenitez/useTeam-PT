import { Share2Icon } from "lucide-react";

const Header = () => {
    return (
        <div className="flex items-center justify-between p-4 border-b border-gray-300">
            <h3 className="text-lg font-semibold">useTeam</h3>
            <div className="flex items-center gap-4">
                <span>
                    <Share2Icon />
                </span>

                <span className="h-10 w-10 flex justify-center items-center border border-gray-300 rounded-full m-auto p-0 text-2xl font-medium bg-gray-100 text-gray-700">
                    D
                </span>
            </div>
        </div>
    );
};

export default Header;
