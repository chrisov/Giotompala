// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           Malaka count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App


// src/App.jsx
import { useState } from 'react';
import Board from './components/board';
import Dice from './components/dice';
import { rollDice } from './game/dice_utils';

function App() {
  const [dice, setDice] = useState([null, null]);

  const handleRoll = () => {
    const result = rollDice();
    setDice(result);
  };

  return (
	<div style={{
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		height: '100vh',
		width: '100vw',
		backgroundColor: '#0B6623',
	  }}>
		<div style={{
		  display: 'flex',
		  flexDirection: 'column',
		  alignItems: 'center',
		  gap: 24,
		  backgroundColor: '#0033A0'
		}}>
      <Board label="Malaka 1" />

      <div style={{ textAlign: 'center' }}>
        <button onClick={handleRoll} style={{ padding: '10px 20px', fontSize: 16 }}>
          Roll the Dice Malaka!
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16, gap: 16 }}>
          {dice[0] !== null && <Dice value={dice[0]} />}
          {dice[1] !== null && <Dice value={dice[1]} />}
        </div>
      </div>

      <Board label="Malaka 2" />
      </div>
    </div>
  );
}

export default App;
