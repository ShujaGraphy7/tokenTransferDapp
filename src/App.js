import { Route, Routes } from 'react-router-dom'
import Routing from './Routing';
import Hero from './Components/Home/Hero';
import './App.css'

function App() {
  return (
    <Routes>

      <Route exact path='/' element={<Routing />}>
        <Route index path='/' element={<Hero />} />
        {/* <Route exact path='/dashboard' element={<MultiSigs />} /> */}

      
      </Route>

    </Routes>
  );
}

export default App;
