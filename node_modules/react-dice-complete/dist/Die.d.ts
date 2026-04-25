import React from 'react';
export type DieRef = {
    getValue: () => number;
    rollDie: (value?: number) => void;
};
export interface DieProps {
    defaultRoll?: number;
    dieCornerRadius?: number;
    dieSize?: number;
    disableIndividual?: boolean;
    disableRandom?: boolean;
    dotColor?: string;
    faceColor?: string;
    margin?: number;
    onRollDone: (value: number) => void;
    outline?: boolean;
    outlineColor?: string;
    rollTime?: number;
    sides?: number;
}
declare const Die: React.ForwardRefExoticComponent<DieProps & React.RefAttributes<DieRef>>;
export default Die;
