/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   dice.jsx                                           :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: itsiros <itsiros@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/30 23:38:00 by itsiros           #+#    #+#             */
/*   Updated: 2025/05/31 00:04:25 by itsiros          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// src/components/Dice.jsx

const pipPositions = {
	1: [[1, 1]],
	2: [[0, 0], [2, 2]],
	3: [[0, 0], [1, 1], [2, 2]],
	4: [[0, 0], [0, 2], [2, 0], [2, 2]],
	5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
	6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
  };
  
  function Dice({ value }) {
	const pips = pipPositions[value] || [];
  
	return (
	  <div style={{
		width: 80,
		height: 80,
		border: '4px solid #000',
		borderRadius: 12,
		backgroundColor: '#fff',
		display: 'grid',
		gridTemplateColumns: 'repeat(3, 1fr)',
		gridTemplateRows: 'repeat(3, 1fr)',
		gap: 4,
		padding: 8,
		boxShadow: '2px 2px 6px rgba(0,0,0,0.2)',
	  }}>
		{[...Array(9)].map((_, i) => {
		  const row = Math.floor(i / 3);
		  const col = i % 3;
		  const isPip = pips.some(([r, c]) => r === row && c === col);
  
		  return (
			<div
			  key={i}
			  style={{
				width: '100%',
				height: '100%',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
			  }}
			>
			  {isPip && (
				<div style={{
				  width: 12,
				  height: 12,
				  borderRadius: '50%',
				  backgroundColor: '#000',
				}} />
			  )}
			</div>
		  );
		})}
	  </div>
	);
  }
  
  export default Dice;
  