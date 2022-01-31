export const borshifyFloat = (a: number) => {
  const pieces = a.toString().split('.');

  const decimalLength = pieces.length > 1 ? pieces[1].length : 0;

  return [a * 10 ** decimalLength, decimalLength];
};

export const unBorshifyFloat = (amount: number, decimalLength: number) => {
  return amount / 10 ** decimalLength;
};
