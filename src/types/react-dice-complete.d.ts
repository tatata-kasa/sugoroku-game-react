declare module 'react-dice-complete' {
  import { Component } from 'react';

  interface ReactDiceProps {
    numDice?: number;
    rollDone?: (total: number, values: number[]) => void;
    faceColor?: string;
    dotColor?: string;
    outline?: boolean;
    outlineColor?: string;
    disableIndividualRollFocus?: boolean;
    dieSize?: number;
    defaultRoll?: number;
    rollTime?: number;
  }

  class ReactDice extends Component<ReactDiceProps> {
    rollAll(values?: number[]): void;
  }

  export default ReactDice;
}
