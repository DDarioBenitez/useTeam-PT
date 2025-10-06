import Board from "./features/board/components/board/Board";
import Header from "./features/board/components/header/Header";
import { TwPreload } from "./styles/TwPreload";

function App() {
    return (
        <div className="flex flex-col h-screen">
            {/* Preload de clases Tailwind usadas dinámicamente */}
            <TwPreload />
            <Header />
            <Board />
        </div>
    );
}

export default App;
