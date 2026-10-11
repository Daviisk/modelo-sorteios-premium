export type ErrorKind="500"|"403"|"410"|"422"|"conexao";export function isErrorKind(value:string):value is ErrorKind{return ["500","403","410","422","conexao"].includes(value);}
