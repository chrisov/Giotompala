/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   board.jsx                                          :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: itsiros <itsiros@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/30 23:39:19 by itsiros           #+#    #+#             */
/*   Updated: 2025/05/31 01:17:20 by itsiros          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// src/components/Board.jsx

function Board({
	label,
	background = '#ffffff',
	borderColor = '#444444',
	textColor = '#000000',
	height = 100,
	width = 300,
  }) {
	return (
	  <div style={{
		width,
		height,
		border: `3px solid ${borderColor}`,
		backgroundColor: background,
		color: textColor,
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
		fontWeight: 'bold',
		borderRadius: 10,
		fontSize: 20,
		boxShadow: '2px 2px 6px rgba(0,0,0,0.1)',
	  }}>
		{label}
	  </div>
	);
  }
  
  export default Board;
  