import React from 'react';
import { DiceContainerProps, DieContainerRef } from './DiceContainer';
export interface ReactDiceProps extends Omit<DiceContainerProps, 'totalCb'> {
    rollDone: (total: number, diceValues: number[]) => void;
}
export type ReactDiceRef = DieContainerRef;
declare const ReactDice: React.ForwardRefExoticComponent<ReactDiceProps & React.RefAttributes<DieContainerRef>>;
export default ReactDice;
