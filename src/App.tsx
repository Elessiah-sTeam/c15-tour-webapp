import BackgroundMap from './components/BackgroundMap.tsx';
import Panels from './components/Panels/Panels.tsx'
import './App.css';

export default function App() {
    return (
        <div className={"window"}>
            <BackgroundMap/>

            <div className={"panel"}>
                <Panels/>
            </div>
        </div>
    );
}
