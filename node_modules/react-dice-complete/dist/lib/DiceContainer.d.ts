import React from 'react';
import { DieProps } from './Die';
import './styles.scss';
export type DieContainerRef = {
    rollAll: (values?: number[]) => void;
};
export interface DiceContainerProps extends Omit<DieProps, 'onRollDone'> {
    numDice: number;
    totalCb: (newTotalValue: number, newDiceValues: number[]) => void;
}
declare const _default: React.MemoExoticComponent<React.ForwardRefExoticComponent<DiceContainerProps & React.RefAttributes<DieContainerRef>>>;
export default _default;
