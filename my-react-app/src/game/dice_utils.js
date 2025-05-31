/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   dice_utils.js                                      :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: itsiros <itsiros@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/30 23:36:26 by itsiros           #+#    #+#             */
/*   Updated: 2025/05/30 23:37:27 by itsiros          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */


export function rollDice()
{
	const die1 = Math.ceil(Math.random() * 6);
	const die2 = Math.ceil(Math.random() * 6);
	return [die1, die2];
}
  